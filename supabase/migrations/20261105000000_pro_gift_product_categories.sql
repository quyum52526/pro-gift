-- Multi-category products: a product can be listed under several categories,
-- e.g. a gadget set shown in both "Tech & Electronic" and "Luxury Boxes".
--
-- public.product_categories holds every category a product belongs to.
-- products.category_id stays as the product's primary category (position 0
-- here): it picks the product-code prefix and the breadcrumb. The app keeps the
-- two in sync through public.pro_gift_set_product_categories().
--
-- Run after 20261026000000 and 20261028000000. Safe to re-run.
--
-- Deploy note: once this table exists, PostgREST sees two paths from products
-- to categories, so `categories(...)` embeds without a hint become ambiguous.
-- Deploy the matching app version (which embeds through product_categories)
-- together with this migration.

begin;

create table if not exists public.product_categories (
  product_id  uuid not null references public.products (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete restrict,
  -- Display order; 0 is the primary category.
  position    integer not null default 0,
  primary key (product_id, category_id)
);

create index if not exists product_categories_category_id_idx
  on public.product_categories (category_id);

-- Every existing product keeps its current category as its primary one.
insert into public.product_categories (product_id, category_id, position)
select id, category_id, 0
from public.products
on conflict (product_id, category_id) do nothing;

-- ---------------------------------------------------------------- row level security

alter table public.product_categories enable row level security;

drop policy if exists "pro_gift product categories readable by everyone" on public.product_categories;
create policy "pro_gift product categories readable by everyone"
  on public.product_categories for select
  using (true);

drop policy if exists "pro_gift admins manage product categories" on public.product_categories;
create policy "pro_gift admins manage product categories"
  on public.product_categories for all
  to authenticated
  using (public.pro_gift_is_admin())
  with check (public.pro_gift_is_admin());

-- ---------------------------------------------------------------- helpers

-- Replaces a product's categories in one transaction. The first id is the
-- primary category and is also written to products.category_id.
-- security invoker: runs as the signed-in admin, so the RLS policies above apply.
create or replace function public.pro_gift_set_product_categories(
  p_product_id uuid,
  p_category_ids uuid[]
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if coalesce(array_length(p_category_ids, 1), 0) = 0 then
    raise exception 'A product needs at least one category.';
  end if;

  update public.products
  set category_id = p_category_ids[1]
  where id = p_product_id;

  delete from public.product_categories
  where product_id = p_product_id;

  insert into public.product_categories (product_id, category_id, position)
  select p_product_id, ids.category_id, (min(ids.ord) - 1)::integer
  from unnest(p_category_ids) with ordinality as ids (category_id, ord)
  group by ids.category_id;
end;
$$;

revoke all on function public.pro_gift_set_product_categories(uuid, uuid[]) from public;
grant execute on function public.pro_gift_set_product_categories(uuid, uuid[]) to authenticated;

commit;
