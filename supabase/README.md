# Supabase setup

The catalogue (categories, products, product images) lives in Supabase. The app
only uses the public anon key; admins write through their own signed-in session,
and Row Level Security decides what they may change.

## 1. Run the migration

Supabase dashboard → **SQL Editor** → paste
[`migrations/20261026000000_pro_gift_catalog.sql`](migrations/20261026000000_pro_gift_catalog.sql) → **Run**.

It creates:

| Object | Purpose |
|---|---|
| `categories` | The six catalogue categories, seeded in display order. |
| `products` | One row per product. Specs and images are JSON arrays; lead time has its own column. |
| `admin_users` | Email allow-list for `/admin`. Not reachable through the API. |
| `pro_gift_is_admin()` | Used by every write policy and by the app's admin check. |
| `product-images` bucket | Public read; only admins can upload, replace or delete. 4 MB, JPG/PNG/WebP/AVIF. |

The three launch products are seeded too, using the images in `public/products`.

Then run [`migrations/20261028000000_pro_gift_dummy_products.sql`](migrations/20261028000000_pro_gift_dummy_products.sql)
the same way. It adds 15 sample products so every category has at least three. Re-running it is safe: slugs that already exist are skipped.

Then run [`migrations/20261105000000_pro_gift_product_categories.sql`](migrations/20261105000000_pro_gift_product_categories.sql).
It lets one product appear in several categories:

| Object | Purpose |
|---|---|
| `product_categories` | Every category a product is listed under. Existing products are copied in from `products.category_id`. |
| `pro_gift_set_product_categories()` | Replaces a product's categories in one transaction; the first id becomes `products.category_id` (the main category, which sets the code prefix and breadcrumb). |

Then run [`migrations/20261106000000_pro_gift_gift_box_availability.sql`](migrations/20261106000000_pro_gift_gift_box_availability.sql).
It adds `products.available_for_gift_box` (default `true`), which decides whether `/gift-box` offers a product as an item to put inside a box. Products listed only under box or packaging categories start as `false`. Admins change it with the "Available in Gift Box Builder" checkbox.

Then run [`migrations/20261122000000_pro_gift_vendors.sql`](migrations/20261122000000_pro_gift_vendors.sql).
It adds the private vendor portal (`/vendor`) and the admin vendor pages (`/admin/vendors`, `/admin/vendors/search`):

| Object | Purpose |
|---|---|
| `vendors` | One row per enlisted vendor: vendor ID (`PGV-XXXXXX`), business name, logo path, address, WhatsApp digits, details, `is_active`. |
| `vendor_products` | A vendor's products: name, optional SKU, description, `price_min`–`price_max`, MOQ, specs and images (storage paths). |
| `vendor_credentials` | bcrypt password hash and failed-sign-in counter. Kept apart so admin reads of `vendors` never include it. |
| `vendor_sessions` | SHA-256 hashes of vendor session tokens (30 days). |
| `vendor_upload_tickets` | One per upload; its id is the storage folder, proving which vendor uploaded a file. |
| `pro_gift_vendor_*()` | The only way vendors read or write: register, login, logout, me, update profile, change password, list / save / delete products, issue upload ticket. Each resolves the session token itself. |
| `pro_gift_admin_search_vendor_products()` | Pro Product Search for admins: all words must match product name, code, description, vendor name or vendor ID. |
| `vendor-images` bucket | Public by exact URL, never listed. Anonymous uploads only into a folder named after a valid, unexpired upload ticket; admins can update or delete. |

Privacy: no table has a policy for `anon`, so the storefront and anyone holding the anon key cannot list vendors or their products. Admins (from `admin_users`) read them directly under RLS, without a vendor password. `/vendor` is `noindex` and disallowed in `robots.txt`.

Vendors aren't Supabase Auth users, so enlisting creates nothing under **Authentication → Users**, and the "Allow new users to sign up" setting doesn't affect them. Five wrong passwords pause a vendor's sign-in for 15 minutes. Vendors with an email reset their own password from "Forgot password"; for one without an email, run in the SQL Editor:

```sql
update public.vendor_credentials
set password_hash = extensions.crypt('<new password>', extensions.gen_salt('bf', 10)),
    failed_attempts = 0, locked_until = null
where vendor_id = (select id from public.vendors where whatsapp = '8801XXXXXXXXX');
```

Then run [`migrations/20261123000000_pro_gift_vendor_whatsapp_login_email_otp.sql`](migrations/20261123000000_pro_gift_vendor_whatsapp_login_email_otp.sql).
Vendors now sign in with their WhatsApp number, and email codes (OTP) confirm enlistment and reset forgotten passwords. Existing vendors, products and passwords are kept:

| Object | Purpose |
|---|---|
| `vendors.whatsapp` (now unique) | The sign-in ID. Existing numbers are re-normalised (`01839698084` → `8801839698084`). If two vendors share a number the migration stops, names them, and changes nothing; give one a different number and run it again. Old `PGV-XXXXXX` codes still sign in and stay searchable in admin. |
| `vendors.email`, `vendors.email_verified_at` | Unique, lower case. Existing vendors have none until they add it on `/vendor/profile`; until then "Forgot password" can't reach them. |
| `vendor_email_otps` | Pending 6-digit codes (hash only), 10 minutes, 5 wrong tries. One code a minute and 5 an hour per email, 300 an hour site-wide. |
| `vendor_app_secret` | Hash of the app's `VENDOR_SERVER_SECRET`. Creating or checking a code needs it, so the public anon key alone can't. |
| `pro_gift_vendor_signup_start/_verify()` | Enlist: details → code emailed → vendor created. Replaces `pro_gift_vendor_register()`, which is dropped. |
| `pro_gift_vendor_reset_start/_complete()` | Forgot password: WhatsApp number or email → code → new password; every other session is signed out. |
| `pro_gift_vendor_update_profile()` | Now also saves the email and reports a number or email used by another vendor. |

Deploy the app code from the same commit right after running it: the old enlist form calls the dropped function.

**Then, once:** create the server secret. In the SQL Editor run

```sql
select public.pro_gift_vendor_rotate_app_secret();
```

and copy the returned value into `VENDOR_SERVER_SECRET` (`.env.local` and Vercel). Running it again replaces the secret, so update the env var each time. Also set `RESEND_API_KEY` and `RESEND_FROM_EMAIL` (see section 3).

Deploy the app version that reads `product_categories` together with these migrations: once the table exists, older app code that embeds `categories(...)` directly gets an "ambiguous relationship" error from the API.

Each migration runs in one transaction. If it fails part-way, nothing is created and it can be re-run.

## 2. Create an admin

1. **Authentication → Users → Add user → Create new user.** Enter the email and a strong password and tick **Auto Confirm User**.
2. Allow that email into the admin, in the SQL Editor:

   ```sql
   insert into public.admin_users (email) values ('you@example.com');
   ```

   Emails are stored in lower case.
3. Recommended: **Authentication → Sign In / Providers → turn off "Allow new users to sign up"**. Only allow-listed users can reach the admin anyway, but this stops strangers from creating accounts.

Sign in at `/admin/login`.

## 3. Environment

`.env.local` (and the Vercel project) need:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon / publishable key>
```

For vendor email codes (server-only, never `NEXT_PUBLIC_`):

```
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=Pro Gift <vendors@your-verified-domain>
VENDOR_SERVER_SECRET=<value from pro_gift_vendor_rotate_app_secret()>
```

Resend's free plan is enough. Until you verify a domain in Resend, it only delivers to your own Resend account email, so verify the domain before vendors enlist. Without the Resend variables, `npm run dev` prints the code in the terminal instead; a production build shows vendors a "not set up yet" message.

Never put the service_role key in a `NEXT_PUBLIC_` variable; this app doesn't need it.

## Changing the schema later

Add a new file in `migrations/` named `YYYYMMDDHHMMSS_description.sql`; don't edit one that has already run. Keep new functions and policies prefixed with `pro_gift_`, because this Supabase project is shared with other apps.
