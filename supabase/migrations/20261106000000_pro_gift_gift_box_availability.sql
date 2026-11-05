-- Gift box builder availability: admins choose which products can be added
-- inside a gift box on /gift-box. Boxes and outer packaging should be off.
--
-- Run after 20261105000000_pro_gift_product_categories.sql. Safe to re-run:
-- the backfill only runs when the column is first added, so later admin
-- choices are never overwritten.

begin;

do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'products'
      and column_name = 'available_for_gift_box'
  ) then
    alter table public.products
      add column available_for_gift_box boolean not null default true;

    -- Products listed only under box / packaging categories start hidden.
    -- A product that is also in a non-packaging category stays available.
    update public.products p
    set available_for_gift_box = false
    where not exists (
      select 1
      from public.product_categories pc
      join public.categories c on c.id = pc.category_id
      where pc.product_id = p.id
        and not (c.slug ~* '(box(es)?\M|packaging)' or c.name ~* '(box(es)?\M|packaging)')
    );
  end if;
end;
$$;

commit;
