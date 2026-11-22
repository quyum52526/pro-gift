import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { controlClass } from "./field";

/** Plain GET form, so a search is a shareable /admin/vendors/search?q=… URL and works without JS. */
export function VendorSearchForm({ defaultValue = "", autoFocus }: { defaultValue?: string; autoFocus?: boolean }) {
  return (
    <form action="/admin/vendors/search" method="get" role="search" className="flex gap-2">
      <label htmlFor="vendor-search" className="sr-only">
        Search vendor products
      </label>
      <div className="relative flex-1">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          id="vendor-search"
          name="q"
          type="search"
          defaultValue={defaultValue}
          autoFocus={autoFocus}
          maxLength={120}
          placeholder="Product name, keyword or code, e.g. ceramic mug, PGV-7K3Q"
          className={`${controlClass} h-11 pl-9`}
        />
      </div>
      <Button type="submit" className="h-11">
        Search
      </Button>
    </form>
  );
}
