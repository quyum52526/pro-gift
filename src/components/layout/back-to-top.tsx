"use client";

import { scrollBehavior } from "@/lib/motion";

export function BackToTop() {
  return (
    <button
      type="button"
      onClick={() => {
        window.scrollTo({ top: 0, behavior: scrollBehavior() });
        // Move focus back to the page start for keyboard and screen-reader users.
        document.querySelector<HTMLElement>("#top a")?.focus({ preventScroll: true });
      }}
      className="pg-btn pg-btn-gold"
    >
      Back to top
    </button>
  );
}
