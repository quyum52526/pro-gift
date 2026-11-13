import type { ReactNode } from "react";
import Link from "next/link";

// [text](/path) or [text](https://…), and **bold**.
const TOKEN = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*(.+?)\*\*/g;

const LINK_CLASS = "font-semibold text-teal underline underline-offset-2 transition-colors hover:text-ink";

/** Renders blog text with inline links and bold. Internal links ("/…") use next/link. */
export function InlineText({ text }: { text: string }) {
  const nodes: ReactNode[] = [];
  let last = 0;

  for (const match of text.matchAll(TOKEN)) {
    const [whole, linkText, href, boldText] = match;
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const key = match.index;

    if (boldText !== undefined) {
      nodes.push(
        <strong key={key} className="font-semibold text-ink">
          {boldText}
        </strong>,
      );
    } else if (href.startsWith("/")) {
      nodes.push(
        <Link key={key} href={href} className={LINK_CLASS}>
          {linkText}
        </Link>,
      );
    } else {
      nodes.push(
        <a key={key} href={href} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
          {linkText}
        </a>,
      );
    }
    last = match.index + whole.length;
  }

  if (last < text.length) nodes.push(text.slice(last));
  return <>{nodes}</>;
}
