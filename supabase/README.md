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

`.env.local` (and the Vercel project) need only:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon / publishable key>
```

Never put the service_role key in a `NEXT_PUBLIC_` variable; this app doesn't need it.

## Changing the schema later

Add a new file in `migrations/` named `YYYYMMDDHHMMSS_description.sql`; don't edit one that has already run. Keep new functions and policies prefixed with `pro_gift_`, because this Supabase project is shared with other apps.
