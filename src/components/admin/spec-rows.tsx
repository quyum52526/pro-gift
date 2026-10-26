"use client";

import * as React from "react";
import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ProductSpec } from "@/types/product";
import { controlClass } from "./field";

interface Row extends ProductSpec {
  key: string;
}

let nextKey = 0;
const toRow = (spec: ProductSpec): Row => ({ ...spec, key: `spec-${nextKey++}` });

/** Editable key/value rows, serialised into a hidden `name` input as JSON. */
export function SpecRows({ name, initial }: { name: string; initial: ProductSpec[] }) {
  const [rows, setRows] = React.useState<Row[]>(() =>
    (initial.length ? initial : [{ label: "", value: "" }]).map(toRow),
  );

  const update = (key: string, patch: Partial<ProductSpec>) =>
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)));

  const serialised = JSON.stringify(rows.map(({ label, value }) => ({ label, value })));

  return (
    <div className="flex flex-col gap-2">
      <input type="hidden" name={name} value={serialised} />
      <div className="grid grid-cols-[2fr_3fr_auto] gap-2 px-0.5 text-xs font-medium text-muted-foreground" aria-hidden>
        <span>Label</span>
        <span>Value</span>
        <span className="w-9" />
      </div>
      {rows.map((row, index) => (
        <div key={row.key} className="grid grid-cols-[2fr_3fr_auto] gap-2">
          <input
            aria-label={`Specification ${index + 1} label`}
            placeholder="e.g. Material"
            value={row.label}
            onChange={(e) => update(row.key, { label: e.target.value })}
            className={controlClass}
          />
          <input
            aria-label={`Specification ${index + 1} value`}
            placeholder="e.g. Grade-A ceramic"
            value={row.value}
            onChange={(e) => update(row.key, { value: e.target.value })}
            className={controlClass}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setRows((current) => current.filter((r) => r.key !== row.key))}
            aria-label={`Remove specification ${index + 1}`}
            className="h-9 w-9 self-center text-muted-foreground hover:text-ink"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setRows((current) => [...current, toRow({ label: "", value: "" })])}
        disabled={rows.length >= 20}
        className="self-start"
      >
        <Plus className="h-4 w-4" /> Add specification
      </Button>
    </div>
  );
}
