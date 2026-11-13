import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { blogHref, coverFitClass, formatPostDate, getAllPosts, postLang } from "@/content/blog";
import { hindSiliguri } from "@/lib/fonts";
import { DEFAULT_OG_IMAGE, OPEN_GRAPH_DEFAULTS } from "@/lib/site";

const TITLE = "Corporate Gift Ideas & Guides | Pro Gift Blog";
const DESCRIPTION =
  "Corporate gift ideas, branding tips and buying guides for companies in Bangladesh, from the Pro Gift team. Plan employee, client and event gifts with ease.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/blog" },
  openGraph: {
    ...OPEN_GRAPH_DEFAULTS,
    title: TITLE,
    description: DESCRIPTION,
    url: "/blog",
    images: [DEFAULT_OG_IMAGE],
  },
};

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <main className="flex-1">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-10 px-4 py-14 sm:px-6 sm:py-[72px]">
        <header className="flex max-w-[760px] flex-col gap-4">
          <h1 className="text-[clamp(30px,4.6vw,44px)] leading-[1.18] font-bold text-ink">Pro Gift Blog</h1>
          <p className="text-base leading-7 text-muted-foreground">
            Corporate gift ideas, branding tips and buying guides for companies in Bangladesh.
          </p>
        </header>

        <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => {
            const lang = postLang(post);
            const bn = lang === "bn";
            return (
              <li key={post.slug}>
                <article
                  lang={bn ? "bn" : undefined}
                  className={`flex h-full flex-col overflow-hidden rounded-2xl border border-hairline bg-surface ${bn ? hindSiliguri.variable : ""}`}
                >
                  <Link href={blogHref(post.slug)} tabIndex={-1} aria-hidden className="block bg-surface-tint">
                    <Image
                      src={post.coverImage}
                      alt=""
                      width={1200}
                      height={630}
                      sizes="(min-width: 1024px) 384px, (min-width: 640px) 50vw, 100vw"
                      className={`block aspect-[1200/630] h-auto w-full ${coverFitClass(post.coverImage)}`}
                    />
                  </Link>
                  <div className="flex flex-1 flex-col gap-3 p-5">
                    <time
                      dateTime={post.publishedAt}
                      className={`text-xs font-semibold text-teal ${bn ? "" : "tracking-[0.08em] uppercase"}`}
                    >
                      {formatPostDate(post.publishedAt, lang)}
                    </time>
                    <h2 className="text-lg leading-snug font-bold text-ink">
                      <Link href={blogHref(post.slug)} className="transition-colors hover:text-teal">
                        {post.title}
                      </Link>
                    </h2>
                    <p className="text-sm leading-6 text-muted-foreground">{post.excerpt}</p>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}
