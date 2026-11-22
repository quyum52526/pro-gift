-- Pro Gift vendor sourcing: private vendor profiles, vendor products, vendor
-- sign-in and the admin product search.
--
-- Run after 20261106000000_pro_gift_gift_box_availability.sql, in the Supabase
-- dashboard → SQL Editor. Runs in one transaction: if it fails, nothing is
-- created and it can be re-run.
--
-- Security model
-- * Vendors are NOT Supabase Auth users. They sign in with their vendor code
--   (PGV-XXXXXX) and a password, checked here with bcrypt. A successful sign-in
--   returns a random session token; the app keeps it in an httpOnly cookie and
--   only its SHA-256 hash is stored.
-- * Every vendor table has RLS on and no policy for anon, so the public
--   catalogue (and anyone holding the anon key) can never list vendors or their
--   products. Vendors read and write only through the security definer
--   functions below, each of which resolves the session token to one vendor.
-- * Admins (public.admin_users, via pro_gift_is_admin()) can read every vendor
--   and product directly, without a vendor password.
-- * Vendor images go to the `vendor-images` bucket. Anonymous uploads are only
--   accepted inside a folder named after an upload ticket that a signed-in
--   vendor obtained in the last 30 minutes.

begin;

create extension if not exists pgcrypto with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- ---------------------------------------------------------------- tables

create table public.vendors (
  id             uuid primary key default gen_random_uuid(),
  -- Vendor User ID, shown to the vendor once they enlist; used to sign in.
  code           text not null unique check (code ~ '^PGV-[A-Z0-9]{6}$'),
  business_name  text not null check (char_length(business_name) between 2 and 120),
  -- Storage path inside the vendor-images bucket: <ticket uuid>/<file uuid>.<ext>
  logo_path      text check (
    logo_path is null
    or logo_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp|avif)$'
  ),
  address        text not null default '' check (char_length(address) <= 300),
  -- International format, digits only (e.g. 8801XXXXXXXXX), ready for wa.me links.
  whatsapp       text not null check (whatsapp ~ '^[0-9]{10,15}$'),
  description    text not null default '' check (char_length(description) <= 2000),
  -- Admins can switch a vendor off; their sign-in and uploads stop working.
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index vendors_business_name_trgm_idx
  on public.vendors using gin (business_name extensions.gin_trgm_ops);

-- Kept apart from vendors so an admin read of vendors never returns a hash.
create table public.vendor_credentials (
  vendor_id        uuid primary key references public.vendors (id) on delete cascade,
  password_hash    text not null,
  failed_attempts  integer not null default 0,
  locked_until     timestamptz,
  updated_at       timestamptz not null default now()
);

create table public.vendor_sessions (
  token_hash  text primary key,
  vendor_id   uuid not null references public.vendors (id) on delete cascade,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null
);

create index vendor_sessions_vendor_id_idx on public.vendor_sessions (vendor_id);

-- One row per upload. Its id is the storage folder of that file, which is how
-- a saved image path is proven to belong to the vendor saving it.
create table public.vendor_upload_tickets (
  id          uuid primary key default gen_random_uuid(),
  vendor_id   uuid not null references public.vendors (id) on delete cascade,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null
);

create index vendor_upload_tickets_vendor_id_idx on public.vendor_upload_tickets (vendor_id);

create table public.vendor_products (
  id           uuid primary key default gen_random_uuid(),
  vendor_id    uuid not null references public.vendors (id) on delete cascade,
  -- The vendor's own SKU, optional.
  code         text check (code is null or code ~ '^[A-Z0-9-]{2,32}$'),
  name         text not null check (char_length(name) between 2 and 120),
  description  text not null default '' check (char_length(description) <= 4000),
  price_min    integer not null check (price_min >= 0),
  price_max    integer not null,
  moq          integer not null default 1 check (moq >= 1),
  -- [{ "label": "Material", "value": "Ceramic" }, ...]
  specs        jsonb not null default '[]'::jsonb check (jsonb_typeof(specs) = 'array'),
  -- [{ "path": "<ticket>/<file>.jpg", "alt": "..." }, ...]
  images       jsonb not null default '[]'::jsonb check (jsonb_typeof(images) = 'array'),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint vendor_products_price_range_valid check (price_max >= price_min)
);

create index vendor_products_vendor_id_idx on public.vendor_products (vendor_id, created_at desc);
create index vendor_products_code_idx on public.vendor_products (code);
create index vendor_products_name_trgm_idx
  on public.vendor_products using gin (name extensions.gin_trgm_ops);

create trigger vendors_set_updated_at
  before update on public.vendors
  for each row execute function public.pro_gift_set_updated_at();

create trigger vendor_credentials_set_updated_at
  before update on public.vendor_credentials
  for each row execute function public.pro_gift_set_updated_at();

create trigger vendor_products_set_updated_at
  before update on public.vendor_products
  for each row execute function public.pro_gift_set_updated_at();

-- ---------------------------------------------------------------- row level security

alter table public.vendors enable row level security;
alter table public.vendor_products enable row level security;
-- No policies: reachable only through the functions below.
alter table public.vendor_credentials enable row level security;
alter table public.vendor_sessions enable row level security;
alter table public.vendor_upload_tickets enable row level security;

revoke all on public.vendor_credentials, public.vendor_sessions, public.vendor_upload_tickets
  from anon, authenticated;

create policy "pro_gift admins read vendors"
  on public.vendors for select
  to authenticated
  using (public.pro_gift_is_admin());

create policy "pro_gift admins update vendors"
  on public.vendors for update
  to authenticated
  using (public.pro_gift_is_admin())
  with check (public.pro_gift_is_admin());

create policy "pro_gift admins delete vendors"
  on public.vendors for delete
  to authenticated
  using (public.pro_gift_is_admin());

create policy "pro_gift admins read vendor products"
  on public.vendor_products for select
  to authenticated
  using (public.pro_gift_is_admin());

create policy "pro_gift admins update vendor products"
  on public.vendor_products for update
  to authenticated
  using (public.pro_gift_is_admin())
  with check (public.pro_gift_is_admin());

create policy "pro_gift admins delete vendor products"
  on public.vendor_products for delete
  to authenticated
  using (public.pro_gift_is_admin());

-- ---------------------------------------------------------------- internal helpers
-- Not callable through the API (execute revoked below); used by the functions
-- that are.

create function public.pro_gift_vendor_hash_token(p_token text)
returns text
language sql
immutable
set search_path = ''
as $$
  select encode(sha256(convert_to(coalesce(p_token, ''), 'UTF8')), 'hex');
$$;

-- Session token → active vendor id, or null.
create function public.pro_gift_vendor_id_for(p_token text)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select s.vendor_id
  from public.vendor_sessions s
  join public.vendors v on v.id = s.vendor_id
  where s.token_hash = public.pro_gift_vendor_hash_token(p_token)
    and s.expires_at > now()
    and v.is_active;
$$;

create function public.pro_gift_vendor_new_session(p_vendor_id uuid)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_token text := encode(extensions.gen_random_bytes(32), 'hex');
begin
  delete from public.vendor_sessions
  where vendor_id = p_vendor_id and expires_at <= now();

  insert into public.vendor_sessions (token_hash, vendor_id, expires_at)
  values (public.pro_gift_vendor_hash_token(v_token), p_vendor_id, now() + interval '30 days');

  return v_token;
end;
$$;

-- True when a storage path was uploaded by this vendor (its folder is one of
-- the vendor's upload tickets).
create function public.pro_gift_vendor_owns_path(p_vendor_id uuid, p_path text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    p_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp|avif)$'
    and exists (
      select 1
      from public.vendor_upload_tickets t
      where t.id::text = split_part(p_path, '/', 1)
        and t.vendor_id = p_vendor_id
    ),
    false
  );
$$;

revoke all on function public.pro_gift_vendor_hash_token(text) from public, anon, authenticated;
revoke all on function public.pro_gift_vendor_id_for(text) from public, anon, authenticated;
revoke all on function public.pro_gift_vendor_new_session(uuid) from public, anon, authenticated;
revoke all on function public.pro_gift_vendor_owns_path(uuid, text) from public, anon, authenticated;

-- ---------------------------------------------------------------- vendor API
-- Called by the app with the anon key. Each takes the session token from the
-- vendor's cookie; none of them trusts a vendor id sent by the caller.

-- Enlists a new vendor and signs them in. Returns their vendor code and a session token.
create function public.pro_gift_vendor_register(
  p_business_name text,
  p_address text,
  p_whatsapp text,
  p_description text,
  p_password text
)
returns table (vendor_code text, session_token text)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  -- No 0/O or 1/I, so codes read back reliably over the phone.
  v_alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_code text;
  v_bytes bytea;
  v_id uuid;
begin
  if p_password is null or char_length(p_password) not between 8 and 72 then
    raise exception 'Password must be 8–72 characters.' using errcode = '22023';
  end if;

  loop
    v_bytes := extensions.gen_random_bytes(6);
    v_code := 'PGV-';
    for i in 0..5 loop
      v_code := v_code || substr(v_alphabet, 1 + (get_byte(v_bytes, i) % 32), 1);
    end loop;
    exit when not exists (select 1 from public.vendors where code = v_code);
  end loop;

  insert into public.vendors (code, business_name, address, whatsapp, description)
  values (
    v_code,
    btrim(coalesce(p_business_name, '')),
    btrim(coalesce(p_address, '')),
    coalesce(p_whatsapp, ''),
    btrim(coalesce(p_description, ''))
  )
  returning id into v_id;

  insert into public.vendor_credentials (vendor_id, password_hash)
  values (v_id, extensions.crypt(p_password, extensions.gen_salt('bf', 10)));

  vendor_code := v_code;
  session_token := public.pro_gift_vendor_new_session(v_id);
  return next;
end;
$$;

-- Returns a session token, or null for a wrong code/password, a disabled
-- vendor, or while the account is paused after 5 failed tries (15 minutes).
create function public.pro_gift_vendor_login(p_code text, p_password text)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_vendor public.vendors;
  v_cred public.vendor_credentials;
begin
  select * into v_vendor
  from public.vendors
  where code = upper(btrim(coalesce(p_code, '')));

  if not found or not v_vendor.is_active then
    -- Same bcrypt cost either way, so timing doesn't reveal which codes exist.
    perform extensions.crypt(coalesce(p_password, ''), extensions.gen_salt('bf', 10));
    return null;
  end if;

  select * into v_cred
  from public.vendor_credentials
  where vendor_id = v_vendor.id
  for update;

  if not found or (v_cred.locked_until is not null and v_cred.locked_until > now()) then
    return null;
  end if;

  if v_cred.password_hash <> extensions.crypt(coalesce(p_password, ''), v_cred.password_hash) then
    update public.vendor_credentials
    set failed_attempts = failed_attempts + 1,
        locked_until = case
          when failed_attempts + 1 >= 5 then now() + interval '15 minutes'
          else null
        end
    where vendor_id = v_vendor.id;
    return null;
  end if;

  update public.vendor_credentials
  set failed_attempts = 0, locked_until = null
  where vendor_id = v_vendor.id;

  return public.pro_gift_vendor_new_session(v_vendor.id);
end;
$$;

create function public.pro_gift_vendor_logout(p_token text)
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  delete from public.vendor_sessions
  where token_hash = public.pro_gift_vendor_hash_token(p_token);
$$;

-- The signed-in vendor's profile: zero or one row.
create function public.pro_gift_vendor_me(p_token text)
returns setof public.vendors
language sql
stable
security definer
set search_path = ''
as $$
  select v.*
  from public.vendors v
  where v.id = public.pro_gift_vendor_id_for(p_token);
$$;

create function public.pro_gift_vendor_update_profile(
  p_token text,
  p_business_name text,
  p_address text,
  p_whatsapp text,
  p_description text,
  p_logo_path text
)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_id uuid := public.pro_gift_vendor_id_for(p_token);
begin
  if v_id is null then
    return false;
  end if;

  if p_logo_path is not null
     and p_logo_path is distinct from (select logo_path from public.vendors where id = v_id)
     and not public.pro_gift_vendor_owns_path(v_id, p_logo_path) then
    raise exception 'Logo file not found. Upload it again.' using errcode = '22023';
  end if;

  update public.vendors
  set business_name = btrim(coalesce(p_business_name, '')),
      address = btrim(coalesce(p_address, '')),
      whatsapp = coalesce(p_whatsapp, ''),
      description = btrim(coalesce(p_description, '')),
      logo_path = p_logo_path
  where id = v_id;

  return true;
end;
$$;

create function public.pro_gift_vendor_change_password(
  p_token text,
  p_current_password text,
  p_new_password text
)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_id uuid := public.pro_gift_vendor_id_for(p_token);
  v_hash text;
begin
  if v_id is null then
    return false;
  end if;
  if p_new_password is null or char_length(p_new_password) not between 8 and 72 then
    raise exception 'Password must be 8–72 characters.' using errcode = '22023';
  end if;

  select password_hash into v_hash from public.vendor_credentials where vendor_id = v_id;
  if v_hash is null or v_hash <> extensions.crypt(coalesce(p_current_password, ''), v_hash) then
    return false;
  end if;

  update public.vendor_credentials
  set password_hash = extensions.crypt(p_new_password, extensions.gen_salt('bf', 10)),
      failed_attempts = 0,
      locked_until = null
  where vendor_id = v_id;

  -- Sign out every other device.
  delete from public.vendor_sessions
  where vendor_id = v_id
    and token_hash <> public.pro_gift_vendor_hash_token(p_token);

  return true;
end;
$$;

create function public.pro_gift_vendor_products(p_token text)
returns setof public.vendor_products
language sql
stable
security definer
set search_path = ''
as $$
  select p.*
  from public.vendor_products p
  where p.vendor_id = public.pro_gift_vendor_id_for(p_token)
  order by p.created_at desc;
$$;

-- Creates (p_product_id null) or updates one of the vendor's products. Returns its id.
create function public.pro_gift_vendor_save_product(
  p_token text,
  p_product_id uuid,
  p_name text,
  p_code text,
  p_description text,
  p_price_min integer,
  p_price_max integer,
  p_moq integer,
  p_specs jsonb,
  p_images jsonb
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_vendor uuid := public.pro_gift_vendor_id_for(p_token);
  v_id uuid;
  v_image jsonb;
begin
  if v_vendor is null then
    raise exception 'Your vendor session has expired. Sign in again.' using errcode = '28000';
  end if;

  if jsonb_typeof(p_images) is distinct from 'array' then
    raise exception 'Images must be a list.' using errcode = '22023';
  end if;
  if jsonb_array_length(p_images) > 8 then
    raise exception 'Up to 8 images.' using errcode = '22023';
  end if;
  if jsonb_typeof(coalesce(p_specs, '[]'::jsonb)) <> 'array' then
    raise exception 'Specifications must be a list.' using errcode = '22023';
  end if;
  for v_image in select value from jsonb_array_elements(p_images) loop
    if jsonb_typeof(v_image) <> 'object'
       or not public.pro_gift_vendor_owns_path(v_vendor, v_image ->> 'path') then
      raise exception 'An image could not be found. Upload it again.' using errcode = '22023';
    end if;
  end loop;

  if p_product_id is null then
    insert into public.vendor_products (
      vendor_id, name, code, description, price_min, price_max, moq, specs, images
    ) values (
      v_vendor, btrim(p_name), nullif(btrim(coalesce(p_code, '')), ''), btrim(coalesce(p_description, '')),
      p_price_min, p_price_max, coalesce(p_moq, 1), coalesce(p_specs, '[]'::jsonb), p_images
    )
    returning id into v_id;
  else
    update public.vendor_products
    set name = btrim(p_name),
        code = nullif(btrim(coalesce(p_code, '')), ''),
        description = btrim(coalesce(p_description, '')),
        price_min = p_price_min,
        price_max = p_price_max,
        moq = coalesce(p_moq, 1),
        specs = coalesce(p_specs, '[]'::jsonb),
        images = p_images
    where id = p_product_id and vendor_id = v_vendor
    returning id into v_id;

    if v_id is null then
      raise exception 'Product not found.' using errcode = 'P0002';
    end if;
  end if;

  return v_id;
end;
$$;

create function public.pro_gift_vendor_delete_product(p_token text, p_product_id uuid)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_vendor uuid := public.pro_gift_vendor_id_for(p_token);
begin
  if v_vendor is null then
    return false;
  end if;
  delete from public.vendor_products where id = p_product_id and vendor_id = v_vendor;
  return found;
end;
$$;

-- A folder name the vendor may upload one image into during the next 30 minutes.
create function public.pro_gift_vendor_issue_upload_ticket(p_token text)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_vendor uuid := public.pro_gift_vendor_id_for(p_token);
  v_ticket uuid;
begin
  if v_vendor is null then
    return null;
  end if;
  insert into public.vendor_upload_tickets (vendor_id, expires_at)
  values (v_vendor, now() + interval '30 minutes')
  returning id into v_ticket;
  return v_ticket;
end;
$$;

-- Used by the storage insert policy.
create function public.pro_gift_vendor_upload_ticket_valid(p_folder text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.vendor_upload_tickets t
    join public.vendors v on v.id = t.vendor_id
    where t.id::text = p_folder
      and t.expires_at > now()
      and v.is_active
  );
$$;

-- ---------------------------------------------------------------- admin API

-- Pro Product Search: every vendor product whose name, code, description,
-- vendor name or vendor code contains all the words of p_query.
create function public.pro_gift_admin_search_vendor_products(p_query text, p_limit integer default 120)
returns table (
  product_id uuid,
  product_code text,
  product_name text,
  product_description text,
  price_min integer,
  price_max integer,
  moq integer,
  specs jsonb,
  images jsonb,
  updated_at timestamptz,
  vendor_id uuid,
  vendor_code text,
  vendor_name text,
  vendor_whatsapp text,
  vendor_logo_path text,
  vendor_address text,
  vendor_active boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_query text := btrim(coalesce(p_query, ''));
  v_words text[];
begin
  if not public.pro_gift_is_admin() then
    raise exception 'Admins only.' using errcode = '42501';
  end if;

  v_words := array(
    select replace(replace(replace(w, '\', '\\'), '%', '\%'), '_', '\_')
    from regexp_split_to_table(lower(v_query), '\s+') as w
    where w <> ''
    limit 8
  );
  if cardinality(v_words) = 0 then
    return;
  end if;

  return query
  select
    p.id, p.code, p.name, p.description, p.price_min, p.price_max, p.moq, p.specs, p.images, p.updated_at,
    v.id, v.code, v.business_name, v.whatsapp, v.logo_path, v.address, v.is_active
  from public.vendor_products p
  join public.vendors v on v.id = p.vendor_id
  where not exists (
    select 1
    from unnest(v_words) as word
    where concat_ws(' ', p.name, p.code, p.description, v.business_name, v.code)
          not ilike '%' || word || '%'
  )
  order by
    (lower(p.name) = lower(v_query) or upper(coalesce(p.code, '')) = upper(v_query)) desc,
    (p.name ilike v_words[1] || '%') desc,
    p.price_min asc,
    p.name asc
  limit least(greatest(coalesce(p_limit, 120), 1), 300);
end;
$$;

-- Every API function: revoke the default PUBLIC grant, then allow the app's roles.
do $$
declare
  fn text;
begin
  foreach fn in array array[
    'public.pro_gift_vendor_register(text, text, text, text, text)',
    'public.pro_gift_vendor_login(text, text)',
    'public.pro_gift_vendor_logout(text)',
    'public.pro_gift_vendor_me(text)',
    'public.pro_gift_vendor_update_profile(text, text, text, text, text, text)',
    'public.pro_gift_vendor_change_password(text, text, text)',
    'public.pro_gift_vendor_products(text)',
    'public.pro_gift_vendor_save_product(text, uuid, text, text, text, integer, integer, integer, jsonb, jsonb)',
    'public.pro_gift_vendor_delete_product(text, uuid)',
    'public.pro_gift_vendor_issue_upload_ticket(text)',
    'public.pro_gift_vendor_upload_ticket_valid(text)',
    'public.pro_gift_admin_search_vendor_products(text, integer)'
  ] loop
    execute format('revoke all on function %s from public', fn);
    execute format('grant execute on function %s to anon, authenticated', fn);
  end loop;
end;
$$;

-- ---------------------------------------------------------------- storage

-- Public read so <img> tags work, but files sit under random ticket folders
-- and nothing lists them, so they are only reachable by exact URL.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'vendor-images',
  'vendor-images',
  true,
  4194304, -- 4 MB, matches the app's upload limit
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do nothing;

create policy "pro_gift vendors upload with a ticket"
  on storage.objects for insert
  to anon, authenticated
  with check (
    bucket_id = 'vendor-images'
    and public.pro_gift_vendor_upload_ticket_valid((storage.foldername(name))[1])
  );

create policy "pro_gift admins update vendor images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'vendor-images' and public.pro_gift_is_admin())
  with check (bucket_id = 'vendor-images' and public.pro_gift_is_admin());

create policy "pro_gift admins delete vendor images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'vendor-images' and public.pro_gift_is_admin());

-- Make the new tables and functions visible to the API right away.
notify pgrst, 'reload schema';

commit;
