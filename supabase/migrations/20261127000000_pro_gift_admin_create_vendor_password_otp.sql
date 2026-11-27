-- Pro Gift vendors: admins create vendor accounts directly, and vendors confirm
-- a password change with a 6-digit email code.
--
-- Run after 20261123000000_pro_gift_vendor_whatsapp_login_email_otp.sql, in the
-- Supabase dashboard → SQL Editor. Runs in one transaction: if it fails, nothing
-- changes and it can be re-run. Additive only: no table, vendor, product,
-- password or image is removed or changed.
--
-- What changes
-- * pro_gift_admin_create_vendor(): signed-in admins (pro_gift_is_admin()) create
--   a vendor with a password, no email code needed. An email given by the admin
--   is stored as verified, so password-reset and password-change codes go to it.
--   It can also return an upload ticket so the admin's logo lands in the
--   vendor's own folder of the vendor-images bucket.
-- * vendor_email_otps accepts a third purpose, 'password_change'.
-- * pro_gift_vendor_change_password_start/_complete(): a signed-in vendor gets a
--   code at the email on their account, then sets the new password with it.
-- * pro_gift_vendor_change_password() (current password only, no code) can no
--   longer be called through the API, so the email code can't be skipped. The
--   function itself is kept.
-- * Public enlisting (pro_gift_vendor_signup_start/_verify) is unchanged and
--   still needs an email code.

begin;

-- ---------------------------------------------------------------- email code purpose

alter table public.vendor_email_otps
  drop constraint if exists vendor_email_otps_purpose_check;

alter table public.vendor_email_otps
  add constraint vendor_email_otps_purpose_check
  check (purpose in ('signup', 'reset', 'password_change'));

-- ---------------------------------------------------------------- admin: create vendor

-- status: ok | whatsapp_taken | email_taken
-- p_email may be empty. p_with_logo_ticket = true also returns a 30-minute upload
-- folder (vendor_upload_tickets) owned by the new vendor, for the logo.
create or replace function public.pro_gift_admin_create_vendor(
  p_business_name text,
  p_whatsapp text,
  p_email text,
  p_address text,
  p_description text,
  p_password text,
  p_with_logo_ticket boolean default false
)
returns table (status text, vendor_id uuid, vendor_code text, upload_ticket uuid)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_name text := btrim(coalesce(p_business_name, ''));
  v_whatsapp text := public.pro_gift_vendor_normalize_whatsapp(p_whatsapp);
  v_email text := nullif(lower(btrim(coalesce(p_email, ''))), '');
  v_address text := btrim(coalesce(p_address, ''));
  v_description text := btrim(coalesce(p_description, ''));
  v_id uuid;
  v_code text;
begin
  if not public.pro_gift_is_admin() then
    raise exception 'Only Pro Gift admins can create vendors.' using errcode = '42501';
  end if;

  if char_length(v_name) not between 2 and 120 then
    raise exception 'Business name must be 2–120 characters.' using errcode = '22023';
  end if;
  if v_whatsapp is null then
    raise exception 'Enter a valid WhatsApp number.' using errcode = '22023';
  end if;
  if v_email is not null
     and (v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' or char_length(v_email) > 254) then
    raise exception 'Enter a valid email address.' using errcode = '22023';
  end if;
  if char_length(v_address) > 300 or char_length(v_description) > 2000 then
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
  if v_email is not null and exists (select 1 from public.vendors where email = v_email) then
    status := 'email_taken';
    return next;
    return;
  end if;

  v_code := public.pro_gift_vendor_new_code();
  begin
    insert into public.vendors (code, business_name, address, whatsapp, email, email_verified_at, description)
    values (
      v_code, v_name, v_address, v_whatsapp, v_email,
      case when v_email is not null then now() end,
      v_description
    )
    returning id into v_id;
  exception when unique_violation then
    -- Another request took the number or email a moment ago.
    status := case
      when exists (select 1 from public.vendors where whatsapp = v_whatsapp) then 'whatsapp_taken'
      else 'email_taken'
    end;
    return next;
    return;
  end;

  insert into public.vendor_credentials (vendor_id, password_hash)
  values (v_id, extensions.crypt(p_password, extensions.gen_salt('bf', 10)));

  status := 'ok';
  vendor_id := v_id;
  vendor_code := v_code;
  if coalesce(p_with_logo_ticket, false) then
    insert into public.vendor_upload_tickets (vendor_id, expires_at)
    values (v_id, now() + interval '30 minutes')
    returning id into upload_ticket;
  end if;
  return next;
end;
$$;

revoke all on function public.pro_gift_admin_create_vendor(text, text, text, text, text, text, boolean)
  from public, anon;
grant execute on function public.pro_gift_admin_create_vendor(text, text, text, text, text, text, boolean)
  to authenticated;

-- ---------------------------------------------------------------- vendor: change password with a code

-- Step 1: email a code to the address on the signed-in vendor's account.
-- status: ok | signed_out | no_email | wait | limit
create or replace function public.pro_gift_vendor_change_password_start(p_secret text, p_token text)
returns table (status text, request_id uuid, otp_code text, email text)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_vendor public.vendors;
begin
  if not public.pro_gift_vendor_app_secret_ok(p_secret) then
    raise exception 'VENDOR_SERVER_SECRET does not match the database.' using errcode = '28000';
  end if;

  v_id := public.pro_gift_vendor_id_for(p_token);
  if v_id is null then
    status := 'signed_out';
    return next;
    return;
  end if;

  select * into v_vendor from public.vendors v where v.id = v_id;
  if v_vendor.email is null then
    status := 'no_email';
    return next;
    return;
  end if;

  return query
  select i.status, i.request_id, i.otp_code, v_vendor.email
  from public.pro_gift_vendor_issue_otp('password_change', v_vendor.email, v_id, null) i;
end;
$$;

-- Step 2: right code → new password, every other device signed out (this one stays).
-- status: ok | signed_out | invalid | expired
create or replace function public.pro_gift_vendor_change_password_complete(
  p_secret text,
  p_token text,
  p_request_id uuid,
  p_code text,
  p_new_password text
)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_status text;
  v_otp public.vendor_email_otps;
begin
  if not public.pro_gift_vendor_app_secret_ok(p_secret) then
    raise exception 'VENDOR_SERVER_SECRET does not match the database.' using errcode = '28000';
  end if;
  if p_new_password is null or char_length(p_new_password) not between 8 and 72 then
    raise exception 'Password must be 8–72 characters.' using errcode = '22023';
  end if;

  v_id := public.pro_gift_vendor_id_for(p_token);
  if v_id is null then
    return 'signed_out';
  end if;

  -- The code must belong to this vendor; someone else's code is treated as unknown.
  select * into v_otp
  from public.vendor_email_otps o
  where o.id = p_request_id and o.purpose = 'password_change';
  if not found or v_otp.vendor_id is distinct from v_id then
    return 'expired';
  end if;

  v_status := public.pro_gift_vendor_check_otp('password_change', p_request_id, p_code);
  if v_status <> 'ok' then
    return v_status;
  end if;

  -- The vendor changed their email after the code was sent.
  if not exists (select 1 from public.vendors v where v.id = v_id and v.email = v_otp.email) then
    return 'expired';
  end if;

  update public.vendor_credentials
  set password_hash = extensions.crypt(p_new_password, extensions.gen_salt('bf', 10)),
      failed_attempts = 0,
      locked_until = null
  where vendor_id = v_id;

  update public.vendors
  set email_verified_at = coalesce(email_verified_at, now())
  where id = v_id;

  delete from public.vendor_sessions
  where vendor_id = v_id
    and token_hash <> public.pro_gift_vendor_hash_token(p_token);

  return 'ok';
end;
$$;

do $$
declare
  fn text;
begin
  foreach fn in array array[
    'public.pro_gift_vendor_change_password_start(text, text)',
    'public.pro_gift_vendor_change_password_complete(text, text, uuid, text, text)'
  ] loop
    execute format('revoke all on function %s from public', fn);
    execute format('grant execute on function %s to anon, authenticated', fn);
  end loop;
end;
$$;

-- Changing the password now needs the email code: the old current-password-only
-- function stays in the database but can't be called through the API.
revoke all on function public.pro_gift_vendor_change_password(text, text, text) from public, anon, authenticated;

-- Make the new functions visible to the API right away.
notify pgrst, 'reload schema';

commit;
