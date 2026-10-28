/** Smooth scrolling unless the visitor asked the OS for reduced motion. Client-only. */
export function scrollBehavior(): ScrollBehavior {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
}
