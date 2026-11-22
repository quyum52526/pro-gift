-- Pro Gift vendors: sign in with the WhatsApp number, vendor email, and
-- 6-digit email codes (OTP) for enlisting and for resetting a forgotten password.
--
-- Run after 20261122000000_pro_gift_vendors.sql, in the Supabase dashboard →
-- SQL Editor. Runs in one transaction: if it fails, nothing changes and it can
-- be re-run. Existing vendors, their products, passwords and images are kept.
--
-- What changes
-- * vendors.whatsapp becomes the sign-in ID, so it must be unique. Existing
--   numbers are re-normalised (01XXXXXXXXX → 8801XXXXXXXXX). If two vendors
--   share a number the migration stops and names them; fix one and re-run.
--   The PGV-XXXXXX code stays as an internal reference (admin search uses it)
--   and still works for signing in.
-- * vendors.email (unique, lower case) and vendors.email_verified_at. Existing
--   vendors have no email until they add one on /vendor/profile.
-- * vendor_email_otps: pending codes. Only a hash of each code is stored.
-- * vendor_app_secret: hash of the app's VENDOR_SERVER_SECRET. Functions that
--   create or check email codes require that secret, so a code can't be
--   created or read by anyone who only has the public anon key.
-- * pro_gift_vendor_register() (enlist without email check) is removed;
--   enlisting now goes through pro_gift_vendor_signup_start/_verify.
--
-- After running it, create the server secret once (see supabase/README.md):
--   select public.pro_gift_vendor_rotate_app_secret();
-- and put the returned value in VENDOR_SERVER_SECRET.

begin;

-- ---------------------------------------------------------------- WhatsApp as sign-in ID

-- Same rules as normalizeWhatsAppNumber() in src/lib/vendor/whatsapp.ts.
create function public.pro_gift_vendor_normalize_whatsapp(p_input text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case when b.d ~ '^[0-9]{10,15}$' then b.d end
  from (
    select case when a.x ~ '^01[0-9]{9}$' then '88' || a.x else a.x end as d
    from (
      select regexp_replace(regexp_replace(coalesce(p_input, ''), '[^0-9]', '', 'g'), '^00', '') as x
    ) a
  ) b;
$$;

update public.vendors
set whatsapp = public.pro_gift_vendor_normalize_whatsapp(whatsapp)
where public.pro_gift_vendor_normalize_whatsapp(whatsapp) is not null
  and whatsapp <> public.pro_gift_vendor_normalize_whatsapp(whatsapp);

do $$
declare
  v_dupes text;
begin
  select string_agg(format('%s used by %s', d.whatsapp, d.names), '; ')
  into v_dupes
  from (
    select whatsapp, string_agg(format('%s (%s)', business_name, code), ', ' order by created_at) as names
    from public.vendors
    group by whatsapp
    having count(*) > 1
  ) d;

  if v_dupes is not null then
    raise exception 'These vendors share a WhatsApp number, so it cannot be a sign-in ID yet: %. Give one of them a different number (update public.vendors set whatsapp = ''880...'' where code = ''PGV-...'';) and run this migration again.', v_dupes;
  end if;
end;
$$;

create unique index vendors_whatsapp_key on public.vendors (whatsapp);

-- ---------------------------------------------------------------- email

alter table public.vendors
  add column email text check (
    email is null
    or (
      char_length(email) <= 254
      and email = lower(email)
      and email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
    )
  ),
  add column email_verified_at timestamptz;

create unique index vendors_email_key on public.vendors (email);

-- ---------------------------------------------------------------- server secret

create table public.vendor_app_secret (
  id           boolean primary key default true check (id),
  secret_hash  text not null,
  created_at   timestamptz not null default now()
);

alter table public.vendor_app_secret enable row level security;
revoke all on public.vendor_app_secret from anon, authenticated;

create function public.pro_gift_vendor_app_secret_ok(p_secret text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    char_length(p_secret) >= 32
    and exists (
      select 1 from public.vendor_app_secret s
      where s.secret_hash = public.pro_gift_vendor_hash_token(p_secret)
    ),
    false
  );
$$;

-- Run in the SQL Editor; returns the new secret once. Not callable through the API.
create function public.pro_gift_vendor_rotate_app_secret()
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_secret text := encode(extensions.gen_random_bytes(32), 'hex');
begin
  insert into public.vendor_app_secret (id, secret_hash)
  values (true, public.pro_gift_vendor_hash_token(v_secret))
  on conflict (id) do update set secret_hash = excluded.secret_hash, created_at = now();
  return v_secret;
end;
$$;

-- ---------------------------------------------------------------- email codes

create table public.vendor_email_otps (
  id           uuid primary key,
  purpose      text not null check (purpose in ('signup', 'reset')),
  email        text not null,
  -- Set for password resets.
  vendor_id    uuid references public.vendors (id) on delete cascade,
  code_hash    text not null,
  -- Signup only: the details to create the vendor with, including a bcrypt hash of the password.
  payload      jsonb not null default '{}'::jsonb,
  attempts     integer not null default 0,
  created_at   timestamptz not null default now(),
  expires_at   timestamptz not null,
  consumed_at  timestamptz
);

create index vendor_email_otps_email_idx on public.vendor_email_otps (email, created_at desc);
create index vendor_email_otps_created_at_idx on public.vendor_email_otps (created_at);

alter table public.vendor_email_otps enable row level security;
revoke all on public.vendor_email_otps from anon, authenticated;

-- New random PGV-XXXXXX reference (no 0/O or 1/I).
create function public.pro_gift_vendor_new_code()
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_code text;
  v_bytes bytea;
begin
  loop
    v_bytes := extensions.gen_random_bytes(6);
    v_code := 'PGV-';
    for i in 0..5 loop
      v_code := v_code || substr(v_alphabet, 1 + (get_byte(v_bytes, i) % 32), 1);
    end loop;
    exit when not exists (select 1 from public.vendors where code = v_code);
  end loop;
  return v_code;
end;
$$;

-- Creates a code for an email. status: ok | wait (asked < 60 s ago) | limit (5 an hour per email,
-- or the whole site is sending too many).
create function public.pro_gift_vendor_issue_otp(
  p_purpose text,
  p_email text,
  p_vendor_id uuid,
  p_payload jsonb
)
returns table (status text, request_id uuid, otp_code text)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_id uuid := gen_random_uuid();
  v_bytes bytea := extensions.gen_random_bytes(4);
  v_code text;
begin
  delete from public.vendor_email_otps where created_at < now() - interval '1 day';

  if exists (
    select 1 from public.vendor_email_otps
    where email = p_email and created_at > now() - interval '60 seconds'
  ) then
    status := 'wait';
    return next;
    return;
  end if;

  if (select count(*) from public.vendor_email_otps
      where email = p_email and created_at > now() - interval '1 hour') >= 5
     or (select count(*) from public.vendor_email_otps
         where created_at > now() - interval '1 hour') >= 300 then
    status := 'limit';
    return next;
    return;
  end if;

  -- A new code replaces any earlier one for the same email and purpose.
  update public.vendor_email_otps
  set expires_at = least(expires_at, now())
  where email = p_email and purpose = p_purpose and consumed_at is null;

  v_code := lpad((
    ((get_byte(v_bytes, 0)::bigint << 24) | (get_byte(v_bytes, 1) << 16)
      | (get_byte(v_bytes, 2) << 8) | get_byte(v_bytes, 3)) % 1000000
  )::text, 6, '0');

  insert into public.vendor_email_otps (id, purpose, email, vendor_id, code_hash, payload, expires_at)
  values (
    v_id, p_purpose, p_email, p_vendor_id,
    public.pro_gift_vendor_hash_token(v_id::text || ':' || v_code),
    coalesce(p_payload, '{}'::jsonb),
    now() + interval '10 minutes'
  );

  status := 'ok';
  request_id := v_id;
  otp_code := v_code;
  return next;
end;
$$;

-- Checks a code; locks the row so two tries can't race. status: ok | invalid | expired.
-- Counts wrong tries without raising, so the count is kept; 5 wrong tries use the code up.
create function public.pro_gift_vendor_check_otp(p_purpose text, p_request_id uuid, p_code text)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_otp public.vendor_email_otps;
begin
  select * into v_otp
  from public.vendor_email_otps o
  where o.id = p_request_id and o.purpose = p_purpose
  for update;

  if not found or v_otp.consumed_at is not null or v_otp.expires_at <= now() or v_otp.attempts >= 5 then
    return 'expired';
  end if;

  if v_otp.code_hash <> public.pro_gift_vendor_hash_token(p_request_id::text || ':' || btrim(coalesce(p_code, ''))) then
    update public.vendor_email_otps o set attempts = o.attempts + 1 where o.id = p_request_id;
    return case when v_otp.attempts + 1 >= 5 then 'expired' else 'invalid' end;
  end if;

  update public.vendor_email_otps o set consumed_at = now() where o.id = p_request_id;
  return 'ok';
end;
$$;

revoke all on function public.pro_gift_vendor_normalize_whatsapp(text) from public, anon, authenticated;
revoke all on function public.pro_gift_vendor_app_secret_ok(text) from public, anon, authenticated;
revoke all on function public.pro_gift_vendor_rotate_app_secret() from public, anon, authenticated;
revoke all on function public.pro_gift_vendor_new_code() from public, anon, authenticated;
revoke all on function public.pro_gift_vendor_issue_otp(text, text, uuid, jsonb) from public, anon, authenticated;
revoke all on function public.pro_gift_vendor_check_otp(text, uuid, text) from public, anon, authenticated;

-- ---------------------------------------------------------------- vendor API

-- Enlisting without an email check is no longer possible.
drop function public.pro_gift_vendor_register(text, text, text, text, text);

-- Step 1 of enlisting: checks the details and creates an email code for the app to send.
-- status: ok | whatsapp_taken | email_taken | wait | limit
create function public.pro_gift_vendor_signup_start(
  p_secret text,
  p_email text,
  p_whatsapp text,
  p_business_name text,
  p_address text,
  p_description text,
  p_password text
)
returns table (status text, request_id uuid, otp_code text)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_whatsapp text := public.pro_gift_vendor_normalize_whatsapp(p_whatsapp);
  v_name text := btrim(coalesce(p_business_name, ''));
  v_address text := btrim(coalesce(p_address, ''));
  v_description text := btrim(coalesce(p_description, ''));
begin
  if not public.pro_gift_vendor_app_secret_ok(p_secret) then
    raise exception 'VENDOR_SERVER_SECRET does not match the database.' using errcode = '28000';
  end if;

  if v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' or char_length(v_email) > 254 then
    raise exception 'Enter a valid email address.' using errcode = '22023';
  end if;
  if v_whatsapp is null then
    raise exception 'Enter a valid WhatsApp number.' using errcode = '22023';
  end if;
  if char_length(v_name) not between 2 and 120 or char_length(v_address) > 300 or char_length(v_description) > 2000 then
    raise exception 'Check the business details.' using errcode = '22023';
  end if;
  if p_password is null or char_length(p_password) not between 8 and 72 then
    raise exception 'Password must be 8–72 characters.' using errcode = '22023';
  end if;

  if exists (select 1 from public.vendors where whatsapp = v_whatsapp) then
    status := 'whatsapp_taken';
    return next;
    return;
  end if;
  if exists (select 1 from public.vendors where email = v_email) then
    status := 'email_taken';
    return next;
    return;
  end if;

  return query
  select * from public.pro_gift_vendor_issue_otp(
    'signup',
    v_email,
    null,
    jsonb_build_object(
      'whatsapp', v_whatsapp,
      'business_name', v_name,
      'address', v_address,
      'description', v_description,
      'password_hash', extensions.crypt(p_password, extensions.gen_salt('bf', 10))
    )
  );
end;
$$;

-- Step 2 of enlisting: the code is right → the vendor is created and signed in.
-- status: ok | invalid | expired | whatsapp_taken | email_taken
create function public.pro_gift_vendor_signup_verify(p_secret text, p_request_id uuid, p_code text)
returns table (status text, vendor_code text, session_token text)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_status text;
  v_otp public.vendor_email_otps;
  v_id uuid;
  v_code text;
begin
  if not public.pro_gift_vendor_app_secret_ok(p_secret) then
    raise exception 'VENDOR_SERVER_SECRET does not match the database.' using errcode = '28000';
  end if;

  v_status := public.pro_gift_vendor_check_otp('signup', p_request_id, p_code);
  if v_status <> 'ok' then
    status := v_status;
    return next;
    return;
  end if;
  select * into v_otp from public.vendor_email_otps where id = p_request_id;

  -- Someone may have enlisted with the same number or email in the last 10 minutes.
  if exists (select 1 from public.vendors where whatsapp = v_otp.payload ->> 'whatsapp') then
    status := 'whatsapp_taken';
    return next;
    return;
  end if;
  if exists (select 1 from public.vendors where email = v_otp.email) then
    status := 'email_taken';
    return next;
    return;
  end if;

  v_code := public.pro_gift_vendor_new_code();
  insert into public.vendors (code, business_name, address, whatsapp, email, email_verified_at, description)
  values (
    v_code,
    v_otp.payload ->> 'business_name',
    v_otp.payload ->> 'address',
    v_otp.payload ->> 'whatsapp',
    v_otp.email,
    now(),
    v_otp.payload ->> 'description'
  )
  returning id into v_id;

  insert into public.vendor_credentials (vendor_id, password_hash)
  values (v_id, v_otp.payload ->> 'password_hash');

  -- The password hash isn't needed any more.
  update public.vendor_email_otps set payload = '{}'::jsonb where id = p_request_id;

  status := 'ok';
  vendor_code := v_code;
  session_token := public.pro_gift_vendor_new_session(v_id);
  return next;
end;
$$;

-- Forgot password, step 1. p_login is the WhatsApp number, the email or the PGV code.
-- status: ok | no_account (none, disabled, or no email on file) | wait | limit.
-- The app shows the same screen for every status except wait/limit.
create function public.pro_gift_vendor_reset_start(p_secret text, p_login text)
returns table (status text, request_id uuid, otp_code text, email text)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_login text := btrim(coalesce(p_login, ''));
  v_vendor public.vendors;
begin
  if not public.pro_gift_vendor_app_secret_ok(p_secret) then
    raise exception 'VENDOR_SERVER_SECRET does not match the database.' using errcode = '28000';
  end if;

  select * into v_vendor
  from public.vendors v
  where (position('@' in v_login) > 0 and v.email = lower(v_login))
     or (upper(v_login) ~ '^PGV-[A-Z0-9]{6}$' and v.code = upper(v_login))
     or v.whatsapp = public.pro_gift_vendor_normalize_whatsapp(v_login)
  limit 1;

  if not found or not v_vendor.is_active or v_vendor.email is null then
    status := 'no_account';
    return next;
    return;
  end if;

  return query
  select i.status, i.request_id, i.otp_code, v_vendor.email
  from public.pro_gift_vendor_issue_otp('reset', v_vendor.email, v_vendor.id, null) i;
end;
$$;

-- Forgot password, step 2: the code is right → new password, every other session
-- signed out, and a new session returned. status: ok | invalid | expired
create function public.pro_gift_vendor_reset_complete(
  p_secret text,
  p_request_id uuid,
  p_code text,
  p_new_password text
)
returns table (status text, session_token text)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_status text;
  v_otp public.vendor_email_otps;
begin
  if not public.pro_gift_vendor_app_secret_ok(p_secret) then
    raise exception 'VENDOR_SERVER_SECRET does not match the database.' using errcode = '28000';
  end if;
  if p_new_password is null or char_length(p_new_password) not between 8 and 72 then
    raise exception 'Password must be 8–72 characters.' using errcode = '22023';
  end if;

  v_status := public.pro_gift_vendor_check_otp('reset', p_request_id, p_code);
  if v_status <> 'ok' then
    status := v_status;
    return next;
    return;
  end if;
  select * into v_otp from public.vendor_email_otps where id = p_request_id;

  -- The vendor was disabled, or changed their email, after the code was sent.
  if not exists (
    select 1 from public.vendors v
    where v.id = v_otp.vendor_id and v.is_active and v.email = v_otp.email
  ) then
    status := 'expired';
    return next;
    return;
  end if;

  update public.vendor_credentials
  set password_hash = extensions.crypt(p_new_password, extensions.gen_salt('bf', 10)),
      failed_attempts = 0,
      locked_until = null
  where vendor_id = v_otp.vendor_id;

  update public.vendors
  set email_verified_at = coalesce(email_verified_at, now())
  where id = v_otp.vendor_id;

  delete from public.vendor_sessions where vendor_id = v_otp.vendor_id;

  status := 'ok';
  session_token := public.pro_gift_vendor_new_session(v_otp.vendor_id);
  return next;
end;
$$;

-- Sign in with the WhatsApp number (any common format) or the older PGV-XXXXXX code.
-- The parameter keeps its old name so the function can be replaced in place.
create or replace function public.pro_gift_vendor_login(p_code text, p_password text)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_login text := btrim(coalesce(p_code, ''));
  v_vendor public.vendors;
  v_cred public.vendor_credentials;
begin
  select * into v_vendor
  from public.vendors v
  where (upper(v_login) ~ '^PGV-[A-Z0-9]{6}$' and v.code = upper(v_login))
     or v.whatsapp = public.pro_gift_vendor_normalize_whatsapp(v_login)
  limit 1;

  if not found or not v_vendor.is_active then
    -- Same bcrypt cost either way, so timing doesn't reveal which numbers exist.
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

-- Profile update now includes the email and reports clashes.
-- status: ok | signed_out | whatsapp_taken | email_taken
-- An empty p_email keeps the current one.
drop function public.pro_gift_vendor_update_profile(text, text, text, text, text, text);

create function public.pro_gift_vendor_update_profile(
  p_token text,
  p_business_name text,
  p_address text,
  p_whatsapp text,
  p_email text,
  p_description text,
  p_logo_path text
)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_id uuid := public.pro_gift_vendor_id_for(p_token);
  v_current public.vendors;
  v_whatsapp text := public.pro_gift_vendor_normalize_whatsapp(p_whatsapp);
  v_email text := nullif(lower(btrim(coalesce(p_email, ''))), '');
begin
  if v_id is null then
    return 'signed_out';
  end if;
  select * into v_current from public.vendors where id = v_id;
  v_email := coalesce(v_email, v_current.email);

  if v_whatsapp is null then
    raise exception 'Enter a valid WhatsApp number.' using errcode = '22023';
  end if;
  if exists (select 1 from public.vendors where whatsapp = v_whatsapp and id <> v_id) then
    return 'whatsapp_taken';
  end if;
  if v_email is not null and exists (select 1 from public.vendors where email = v_email and id <> v_id) then
    return 'email_taken';
  end if;

  if p_logo_path is not null
     and p_logo_path is distinct from v_current.logo_path
     and not public.pro_gift_vendor_owns_path(v_id, p_logo_path) then
    raise exception 'Logo file not found. Upload it again.' using errcode = '22023';
  end if;

  update public.vendors
  set business_name = btrim(coalesce(p_business_name, '')),
      address = btrim(coalesce(p_address, '')),
      whatsapp = v_whatsapp,
      email = v_email,
      email_verified_at = case when v_email is distinct from v_current.email then null else email_verified_at end,
      description = btrim(coalesce(p_description, '')),
      logo_path = p_logo_path
  where id = v_id;

  return 'ok';
end;
$$;

do $$
declare
  fn text;
begin
  foreach fn in array array[
    'public.pro_gift_vendor_signup_start(text, text, text, text, text, text, text)',
    'public.pro_gift_vendor_signup_verify(text, uuid, text)',
    'public.pro_gift_vendor_reset_start(text, text)',
    'public.pro_gift_vendor_reset_complete(text, uuid, text, text)',
    'public.pro_gift_vendor_update_profile(text, text, text, text, text, text, text)'
  ] loop
    execute format('revoke all on function %s from public', fn);
    execute format('grant execute on function %s to anon, authenticated', fn);
  end loop;
end;
$$;

-- Make the new columns and functions visible to the API right away.
notify pgrst, 'reload schema';

commit;
