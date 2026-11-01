-- Lets admins choose which catalogue products appear in the gift box builder.
--
-- Run once in the Supabase dashboard → SQL Editor (or `supabase db push`).
-- Existing products start switched off; tick "Show in gift box builder" on each
-- product in /admin. Reads and writes are covered by the existing products policies.

begin;

alter table public.products
  add column if not exists is_gift_box_item boolean not null default false;

commit;
