import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

/** Cropped wordmark from public/brand (aspect ratio 869 × 194). */
const WORDMARK = { src: "/brand/logo-wordmark.svg", width: 869, height: 194 } as const;

interface BrandLogoProps {
  className?: string;
  /** Set on the instance that is visible above the fold (the header). */
  priority?: boolean;
}

export function BrandLogo({ className, priority = false }: BrandLogoProps) {
  return (
    <Link
      href="/"
      aria-label="Pro Gift home"
      className={cn(
        "inline-flex shrink-0 items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className,
      )}
    >
      <Image
        src={WORDMARK.src}
        width={WORDMARK.width}
        height={WORDMARK.height}
        alt="Pro Gift – Corporate Gift Shop"
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        className="h-8 w-auto sm:h-10"
      />
    </Link>
  );
}
