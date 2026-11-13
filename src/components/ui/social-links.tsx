import { SOCIAL_LINKS } from "@/lib/site";
import { cn } from "@/lib/utils";
import { SocialIcon } from "./social-icons";

const TONES = {
  /** On the ink footer. */
  dark: "bg-surface/10 text-surface group-hover:bg-gold group-hover:text-ink group-focus-visible:outline-gold",
  /** On white or tinted surfaces. */
  light: "bg-surface-tint text-ink group-hover:bg-teal group-hover:text-surface group-focus-visible:outline-teal",
};

/**
 * Row of round icon links to Pro Gift's social profiles and WhatsApp, from SOCIAL_LINKS in lib/site.ts.
 * Each link is a 44px tap target around a 40px circle.
 */
export function SocialLinks({ tone, className }: { tone: keyof typeof TONES; className?: string }) {
  return (
    <ul className={cn("flex flex-wrap items-center gap-1", className)}>
      {SOCIAL_LINKS.map((link) => (
        <li key={link.platform}>
          <a
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Pro Gift on ${link.name}`}
            className="group grid size-11 place-items-center rounded-full outline-none"
          >
            <span
              className={cn(
                "grid size-10 place-items-center rounded-full outline-offset-2 transition-colors duration-200 group-focus-visible:outline-2 group-focus-visible:outline-solid",
                TONES[tone],
              )}
            >
              <SocialIcon platform={link.platform} className="size-5" />
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
