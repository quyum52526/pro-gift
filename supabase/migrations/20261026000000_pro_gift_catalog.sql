-- Pro Gift catalogue: categories, products, admin allow-list and image storage.
--
-- Run once in the Supabase dashboard → SQL Editor (or `supabase db push`).
-- This project is shared with other apps, so every function and policy is
-- prefixed with `pro_gift_` and nothing outside these objects is touched.
--
-- Security model: everyone can read the catalogue; only signed-in users whose
-- email is in public.admin_users can write rows or upload images. The app never
-- uses the service_role key: writes run as the admin's own session under RLS.

begin;

-- ---------------------------------------------------------------- tables

create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name        text not null unique,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

create table public.products (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  code              text not null unique check (code ~ '^[A-Z0-9-]{3,32}$'),
  name              text not null check (char_length(name) between 2 and 120),
  category_id       uuid not null references public.categories (id) on delete restrict,
  short_description text not null default '',
  description       text not null default '',
  price_min         integer not null check (price_min >= 0),
  price_max         integer not null,
  moq               integer not null default 1 check (moq >= 1),
  lead_time         text,
  video_url         text check (video_url is null or video_url ~ '^https://'),
  -- [{ "label": "Material", "value": "Ceramic" }, ...]
  specs             jsonb not null default '[]'::jsonb check (jsonb_typeof(specs) = 'array'),
  branding_methods  text[] not null default '{}',
  -- [{ "src": "...", "alt": "...", "path": "storage/path", "printArea": {...} }, ...]
  images            jsonb not null default '[]'::jsonb check (jsonb_typeof(images) = 'array'),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint products_price_range_valid check (price_max >= price_min)
);

create index products_category_id_idx on public.products (category_id);

-- Emails allowed into /admin. Add rows here after creating the auth user.
create table public.admin_users (
  email       text primary key check (email = lower(email)),
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------- helpers

create function public.pro_gift_set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.pro_gift_set_updated_at();

-- security definer so policies can read admin_users without exposing it.
create function public.pro_gift_is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke all on function public.pro_gift_is_admin() from public;
grant execute on function public.pro_gift_is_admin() to anon, authenticated;

-- ---------------------------------------------------------------- row level security

alter table public.categories enable row level security;
alter table public.products enable row level security;
-- No policies on admin_users: unreachable through the API.
alter table public.admin_users enable row level security;

create policy "pro_gift categories readable by everyone"
  on public.categories for select
  using (true);

create policy "pro_gift admins manage categories"
  on public.categories for all
  to authenticated
  using (public.pro_gift_is_admin())
  with check (public.pro_gift_is_admin());

create policy "pro_gift products readable by everyone"
  on public.products for select
  using (true);

create policy "pro_gift admins insert products"
  on public.products for insert
  to authenticated
  with check (public.pro_gift_is_admin());

create policy "pro_gift admins update products"
  on public.products for update
  to authenticated
  using (public.pro_gift_is_admin())
  with check (public.pro_gift_is_admin());

create policy "pro_gift admins delete products"
  on public.products for delete
  to authenticated
  using (public.pro_gift_is_admin());

-- ---------------------------------------------------------------- storage

-- Public bucket: files are served from /storage/v1/object/public/product-images/...
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  4194304, -- 4 MB, matches the app's upload limit
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do nothing;

create policy "pro_gift admins upload product images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-images' and public.pro_gift_is_admin());

create policy "pro_gift admins update product images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'product-images' and public.pro_gift_is_admin())
  with check (bucket_id = 'product-images' and public.pro_gift_is_admin());

create policy "pro_gift admins delete product images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-images' and public.pro_gift_is_admin());

-- ---------------------------------------------------------------- seed data

insert into public.categories (slug, name, sort_order) values
  ('handcrafted-leather',       'Handcrafted Leather',       1),
  ('tech-electronic',           'Tech & Electronic',         2),
  ('executive-desk-organizers', 'Executive Desk Organizers', 3),
  ('awards-crests',             'Awards & Crests',           4),
  ('luxury-boxes',              'Luxury Boxes',              5),
  ('promotional-items',         'Promotional Items',         6);

-- The three launch products, moved over from src/data/products.ts.
-- Their images stay in /public/products, so `src` is a site-relative path.
insert into public.products (
  slug, code, name, category_id, short_description, description,
  price_min, price_max, moq, lead_time, specs, branding_methods, images
) values
(
  'executive-ceramic-mug', 'PG-MUG-101', 'Executive Ceramic Mug',
  (select id from public.categories where slug = 'promotional-items'),
  '350 ml premium ceramic mug with a glossy finish, made for logo branding.',
  'A heavyweight 350 ml ceramic mug with a smooth glossy glaze and comfortable C-handle. It takes full-colour sublimation and screen printing well, so your logo stays sharp through daily office use and dishwashing. A good fit for onboarding kits, client gifts and events.',
  350, 650, 50, '5–7 working days',
  '[{"label":"Material","value":"Grade-A ceramic"},{"label":"Capacity","value":"350 ml"},{"label":"Print area","value":"8 × 6 cm"}]',
  array['Sublimation', 'Screen print', 'Laser engraving'],
  '[{"src":"/products/mug-front.svg","alt":"White executive ceramic mug, front view","printArea":{"x":31,"y":42,"width":30,"height":24}},
    {"src":"/products/mug-teal.svg","alt":"Teal executive ceramic mug","printArea":{"x":31,"y":42,"width":30,"height":24}},
    {"src":"/products/mug-ink.svg","alt":"Matte black executive ceramic mug","printArea":{"x":31,"y":42,"width":30,"height":24}}]'
),
(
  'executive-leather-diary', 'PG-DRY-204', 'Executive Leather Diary',
  (select id from public.categories where slug = 'handcrafted-leather'),
  'A5 PU-leather diary with ribbon marker and elastic band.',
  'An A5 hardcover diary wrapped in soft-touch PU leather, with 192 pages of 80 gsm cream paper, a ribbon marker and an elastic closure. Debossed or foil-stamped logos look refined on the cover, making it a staple for year-end and annual meeting gifts.',
  450, 1200, 30, '7–10 working days',
  '[{"label":"Cover","value":"Soft-touch PU leather"},{"label":"Pages","value":"192 · 80 gsm cream"},{"label":"Size","value":"A5 (14.8 × 21 cm)"}]',
  array['Deboss', 'Gold / silver foil', 'UV print'],
  '[{"src":"/products/diary-front.svg","alt":"Black executive leather diary, front cover","printArea":{"x":31,"y":36,"width":32,"height":22}},
    {"src":"/products/diary-teal.svg","alt":"Teal executive leather diary","printArea":{"x":31,"y":36,"width":32,"height":22}},
    {"src":"/products/diary-tan.svg","alt":"Tan executive leather diary","printArea":{"x":31,"y":36,"width":32,"height":22}}]'
),
(
  'steel-vacuum-tumbler', 'PG-TMB-310', 'Steel Vacuum Tumbler',
  (select id from public.categories where slug = 'promotional-items'),
  '500 ml double-wall stainless steel tumbler, keeps drinks hot for 12 hours.',
  'A 500 ml double-wall vacuum tumbler in 304 stainless steel with a leak-proof lid. It keeps drinks hot for 12 hours and cold for 24. Laser engraving reveals bright steel under the powder coat for a clean, permanent logo.',
  950, 2500, 25, '7–12 working days',
  '[{"label":"Material","value":"304 stainless steel"},{"label":"Capacity","value":"500 ml"},{"label":"Insulation","value":"12 h hot · 24 h cold"}]',
  array['Laser engraving', 'UV print', 'Screen print'],
  '[{"src":"/products/tumbler-front.svg","alt":"Stainless steel vacuum tumbler, front view","printArea":{"x":40,"y":44,"width":20,"height":18}},
    {"src":"/products/tumbler-teal.svg","alt":"Teal powder-coated vacuum tumbler","printArea":{"x":40,"y":44,"width":20,"height":18}},
    {"src":"/products/tumbler-gold.svg","alt":"Gold powder-coated vacuum tumbler","printArea":{"x":40,"y":44,"width":20,"height":18}}]'
);

commit;
