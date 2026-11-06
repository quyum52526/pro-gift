import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/config";

const LOGIN_PATH = "/admin/login";
const CATEGORY_PARAM = "category";

export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  if (pathname.startsWith("/admin")) return adminGate(request);
  if (pathname === "/" && searchParams.has(CATEGORY_PARAM)) {
    return redirectOldCategoryFilter(request, searchParams.get(CATEGORY_PARAM) ?? "");
  }
  return NextResponse.next();
}

/**
 * Old category filters (/?category=<slug>) now have their own pages. Sends a known slug to
 * the clean /category/<slug> and anything else to the home page, both without a query string.
 */
async function redirectOldCategoryFilter(request: NextRequest, slug: string) {
  const url = request.nextUrl.clone();
  url.search = "";

  if (!/^[a-z0-9-]+$/.test(slug)) {
    url.pathname = "/";
    return NextResponse.redirect(url, 301);
  }

  const { data, error } = await createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
    .from("categories")
    .select("slug")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    // Lookup failed, so the answer is unknown: send home with a temporary redirect
    // so search engines don't cache it.
    console.error("[proxy] Category lookup failed:", error.message);
    url.pathname = "/";
    return NextResponse.redirect(url, 302);
  }

  url.pathname = data ? `/category/${slug}` : "/";
  return NextResponse.redirect(url, 301);
}

/**
 * Keeps the Supabase session fresh on admin routes and bounces signed-out
 * visitors to the login page. This is only a fast first gate: every admin
 * page and Server Action re-checks the session and the admin allow-list.
 */
async function adminGate(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet, headers) => {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        for (const [key, value] of Object.entries(headers)) response.headers.set(key, value);
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoginPage = request.nextUrl.pathname === LOGIN_PATH;
  if (!user && !isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = LOGIN_PATH;
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    // Only home page requests that carry an old ?category= filter. Literal: matchers are read at build time.
    { source: "/", has: [{ type: "query", key: "category" }] },
  ],
};
