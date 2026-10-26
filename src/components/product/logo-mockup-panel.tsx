"use client";

import * as React from "react";
import { ImageUp, RotateCcw, Trash2, Wand2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { LogoMockupState, PrintStyle } from "./types";

const ACCEPTED_TYPES = ["image/png", "image/svg+xml", "image/jpeg", "image/webp"];
const MAX_FILE_BYTES = 5 * 1024 * 1024;

const DEFAULT_ADJUSTMENTS = { scale: 80, offsetX: 0, offsetY: 0 } as const;

const PRINT_STYLES: { value: PrintStyle; label: string; short: string }[] = [
  { value: "colour", label: "Full colour", short: "Colour" },
  { value: "white", label: "White print", short: "White" },
  { value: "engraved", label: "Engraved", short: "Engrave" },
];

interface LogoMockupPanelProps {
  logo: LogoMockupState | null;
  onChange: (logo: LogoMockupState | null) => void;
  /** False when the selected image has no print area defined. */
  canPreviewCurrent: boolean;
  /** Dense layout for narrow columns such as the quick view. */
  compact?: boolean;
}

export function LogoMockupPanel({
  logo,
  onChange,
  canPreviewCurrent,
  compact = false,
}: LogoMockupPanelProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const headingId = React.useId();
  const [error, setError] = React.useState<string | null>(null);
  const [dragging, setDragging] = React.useState(false);

  // Release the previous object URL whenever the logo file changes or the panel unmounts.
  const logoUrl = logo?.url;
  React.useEffect(() => {
    if (!logoUrl) return;
    return () => URL.revokeObjectURL(logoUrl);
  }, [logoUrl]);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Please upload a PNG, SVG, JPG or WebP file.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError("File is larger than 5 MB.");
      return;
    }
    setError(null);
    onChange({
      url: URL.createObjectURL(file),
      fileName: file.name,
      style: logo?.style ?? "colour",
      ...DEFAULT_ADJUSTMENTS,
    });
  };

  const update = (patch: Partial<LogoMockupState>) => logo && onChange({ ...logo, ...patch });

  return (
    <section
      aria-labelledby={headingId}
      className={cn(
        "border",
        compact ? "rounded-xl bg-surface p-3" : "rounded-2xl bg-surface-tint/60 p-5",
      )}
    >
      <div className={cn("flex items-center", compact ? "gap-2.5" : "items-start gap-3")}>
        <span
          className={cn(
            "flex shrink-0 items-center justify-center bg-gold/25 text-gold-deep",
            compact ? "h-8 w-8 rounded-lg" : "h-10 w-10 rounded-xl",
          )}
        >
          <Wand2 className={compact ? "h-4 w-4" : "h-5 w-5"} aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 id={headingId} className={cn("font-semibold text-ink", compact && "text-sm")}>
            Preview your logo
          </h2>
          <p className={cn("text-muted-foreground", compact ? "text-xs" : "text-sm")}>
            {compact
              ? "Stays on your device."
              : "Upload your logo to see it on the product. Stays on your device; nothing is uploaded."}
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="sr-only"
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {!logo ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleFile(e.dataTransfer.files?.[0]);
          }}
          className={cn(
            "flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            compact ? "mt-3 gap-1 bg-surface-tint/60 px-3 py-4" : "mt-4 gap-2 bg-surface px-4 py-6",
            dragging ? "border-teal bg-surface-tint" : "border-border hover:border-teal",
          )}
        >
          <ImageUp className={cn("text-teal", compact ? "h-5 w-5" : "h-6 w-6")} aria-hidden />
          <span className={cn("font-medium text-ink", compact ? "text-xs" : "text-sm")}>
            {compact ? "Upload or drop logo" : "Click or drop your logo here"}
          </span>
          <span className={cn("text-muted-foreground", compact ? "text-[11px]" : "text-xs")}>
            {compact ? "PNG, SVG, JPG · max 5 MB" : "PNG with transparent background works best · max 5 MB"}
          </span>
        </button>
      ) : (
        <div className={compact ? "mt-3 space-y-3" : "mt-4 space-y-4"}>
          <div
            className={cn(
              "flex items-center justify-between gap-2 rounded-lg",
              compact ? "bg-surface-tint/60 py-1 pl-2.5 pr-1" : "rounded-xl bg-surface px-3 py-2",
            )}
          >
            <span
              className={cn("truncate font-medium text-ink", compact ? "text-xs" : "text-sm")}
              title={logo.fileName}
            >
              {logo.fileName}
            </span>
            <div className="flex shrink-0 gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => inputRef.current?.click()}
                className={cn(compact && "h-7 px-2 text-xs")}
              >
                Replace
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onChange(null)}
                aria-label="Remove logo"
                className={cn(
                  "text-muted-foreground hover:text-ink",
                  compact ? "h-7 w-7" : "h-9 w-9",
                )}
              >
                <Trash2 className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
              </Button>
            </div>
          </div>

          {!canPreviewCurrent && (
            <p className="text-xs text-gold-deep">This image has no print area. Pick another view.</p>
          )}

          <fieldset>
            <legend className={cn("font-medium text-ink", compact ? "mb-1.5 text-xs" : "mb-2 text-sm")}>
              Print style
            </legend>
            <div
              className={cn(
                "grid grid-cols-3",
                compact ? "gap-1 rounded-lg bg-surface-tint/60 p-1" : "gap-2",
              )}
            >
              {PRINT_STYLES.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={logo.style === option.value}
                  aria-label={compact ? option.label : undefined}
                  onClick={() => update({ style: option.value })}
                  className={cn(
                    "text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    compact
                      ? cn(
                          "rounded-md px-1 py-1.5",
                          logo.style === option.value
                            ? "bg-teal text-surface shadow-sm"
                            : "text-ink hover:bg-surface",
                        )
                      : cn(
                          "rounded-lg border px-2 py-2",
                          logo.style === option.value
                            ? "border-teal bg-teal text-surface"
                            : "bg-surface text-ink hover:border-teal",
                        ),
                  )}
                >
                  {compact ? option.short : option.label}
                </button>
              ))}
            </div>
          </fieldset>

          <div className={compact ? "grid gap-2.5 sm:grid-cols-3 sm:gap-4" : "space-y-4"}>
            <RangeField
              label="Size"
              value={logo.scale}
              min={40}
              max={100}
              suffix="%"
              compact={compact}
              onChange={(scale) => update({ scale })}
            />
            {/* Compact mode flattens the offsets into the parent grid: size · x · y in one row. */}
            <div className={compact ? "contents" : "grid grid-cols-2 gap-4"}>
              <RangeField
                label={compact ? "Horizontal" : "Left / right"}
                value={logo.offsetX}
                min={-25}
                max={25}
                compact={compact}
                onChange={(offsetX) => update({ offsetX })}
              />
              <RangeField
                label={compact ? "Vertical" : "Up / down"}
                value={logo.offsetY}
                min={-25}
                max={25}
                compact={compact}
                onChange={(offsetY) => update({ offsetY })}
              />
            </div>
          </div>

          <Button
            variant={compact ? "ghost" : "outline"}
            size="sm"
            onClick={() => update(DEFAULT_ADJUSTMENTS)}
            className={cn(compact && "h-8 w-full text-xs text-teal hover:text-teal-dark sm:w-auto")}
          >
            <RotateCcw className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} /> Reset position
          </Button>
        </div>
      )}

      {error && (
        <p role="alert" className={cn("text-red-700", compact ? "mt-2 text-xs" : "mt-3 text-sm")}>
          {error}
        </p>
      )}
    </section>
  );
}

interface RangeFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  suffix?: string;
  compact?: boolean;
  onChange: (value: number) => void;
}

function RangeField({ label, value, min, max, suffix = "", compact, onChange }: RangeFieldProps) {
  const id = React.useId();
  return (
    <div>
      <div
        className={cn(
          "flex items-center justify-between",
          compact ? "mb-0.5 text-xs" : "mb-1 text-sm",
        )}
      >
        <label htmlFor={id} className="font-medium text-ink">
          {label}
        </label>
        <span className="tabular-nums text-muted-foreground">
          {value}
          {suffix}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={cn("w-full accent-teal", compact && "h-1.5")}
      />
    </div>
  );
}
