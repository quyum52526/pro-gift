"use client";

import { useEffect, useRef } from "react";

/**
 * Publishes the sticky header's live height as --header-h on <html>, which
 * scroll-padding-top uses so #catalog and other anchors land below the header.
 * Render it inside the header.
 */
export function HeaderHeight() {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const header = ref.current?.closest("header");
    if (!header) return;
    const root = document.documentElement;
    const observer = new ResizeObserver(([entry]) => {
      root.style.setProperty("--header-h", `${Math.round(entry.borderBoxSize[0].blockSize)}px`);
    });
    observer.observe(header);
    return () => {
      observer.disconnect();
      root.style.removeProperty("--header-h");
    };
  }, []);

  return <span ref={ref} hidden />;
}
