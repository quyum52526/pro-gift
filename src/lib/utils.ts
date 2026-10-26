import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const bdtFormatter = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

/** Formats a taka amount with South Asian digit grouping, e.g. 125000 -> "৳1,25,000". */
export function formatBDT(amount: number): string {
  return `৳${bdtFormatter.format(amount)}`;
}

export function formatPriceRange(min: number, max: number): string {
  return min === max ? formatBDT(min) : `${formatBDT(min)} – ${formatBDT(max)}`;
}
