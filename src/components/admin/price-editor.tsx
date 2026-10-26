"use client";

import * as React from "react";
import { Check, Loader2 } from "lucide-react";

import { updatePriceRange } from "@/app/admin/products/actions";
import { IDLE_STATE } from "@/lib/admin/form-state";
import { cn } from "@/lib/utils";

interface PriceEditorProps {
  productId: string;
  productName: string;
  min: number;
  max: number;
}

/** Inline min/max price form for one product row. */
export function PriceEditor({ productId, productName, min, max }: PriceEditorProps) {
  const [state, formAction, pending] = React.useActionState(updatePriceRange, IDLE_STATE);
  const [dirty, setDirty] = React.useState(false);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setDirty(false);
    React.startTransition(() => formAction(formData));
  };

  const inputClass = cn(
    "h-8 w-20 rounded-md border border-input bg-surface px-2 text-right text-sm tabular-nums text-ink transition focus-visible:border-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
    state.status === "error" && !dirty && "border-red-500",
  );

  return (
    <form onSubmit={onSubmit} onChange={() => setDirty(true)} className="flex flex-col items-end gap-1">
      <input type="hidden" name="id" value={productId} />
      <div className="flex items-center gap-1.5">
        <span className="text-sm text-muted-foreground" aria-hidden>
          ৳
        </span>
        <input
          name="price_min"
          type="number"
          min={0}
          step={1}
          defaultValue={min}
          aria-label={`${productName} minimum price`}
          className={inputClass}
        />
        <span className="text-muted-foreground" aria-hidden>
          –
        </span>
        <input
          name="price_max"
          type="number"
          min={0}
          step={1}
          defaultValue={max}
          aria-label={`${productName} maximum price`}
          className={inputClass}
        />
        <button
          type="submit"
          disabled={pending || !dirty}
          className="ml-1 inline-flex h-8 items-center gap-1 rounded-md bg-teal px-2.5 text-xs font-medium text-surface transition hover:bg-teal-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:bg-surface-tint disabled:text-muted-foreground"
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : null}
          Save
        </button>
      </div>
      <p aria-live="polite" className="h-4 text-xs">
        {!dirty && state.status === "success" && (
          <span className="inline-flex items-center gap-1 text-teal">
            <Check className="h-3 w-3" aria-hidden /> Saved
          </span>
        )}
        {!dirty && state.status === "error" && <span className="text-red-700">{state.message}</span>}
      </p>
    </form>
  );
}
