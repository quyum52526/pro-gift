"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, ImagePlus, Loader2, Star, Trash2, TriangleAlert } from "lucide-react";

import { discardUploadedImage, uploadProductImage } from "@/app/admin/products/actions";
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGES, MAX_IMAGE_BYTES } from "@/lib/admin/form-state";
import type { StoredImage } from "@/lib/catalog/types";
import { cn } from "@/lib/utils";
import { controlClass } from "./field";

type Item = StoredImage & {
  key: string;
  status: "ready" | "uploading" | "error";
  error?: string;
  /** Uploaded in this session; deleted from Storage if removed before saving. */
  isNew?: boolean;
};

interface ImageUploaderProps {
  name: string;
  initial: StoredImage[];
  /** Lets the form block submit while files are still uploading. */
  onBusyChange: (busy: boolean) => void;
  invalid?: boolean;
}

let nextKey = 0;

export function ImageUploader({ name, initial, onBusyChange, invalid }: ImageUploaderProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [items, setItems] = React.useState<Item[]>(() =>
    initial.map((image) => ({ ...image, key: `img-${nextKey++}`, status: "ready" })),
  );
  const [dragging, setDragging] = React.useState(false);

  const busy = items.some((item) => item.status === "uploading");
  React.useEffect(() => onBusyChange(busy), [busy, onBusyChange]);

  const patch = (key: string, next: Partial<Item>) =>
    setItems((current) => current.map((item) => (item.key === key ? { ...item, ...next } : item)));

  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const room = MAX_IMAGES - items.length;
    const queued = Array.from(files)
      .slice(0, Math.max(room, 0))
      .map((file) => {
        const key = `img-${nextKey++}`;
        const problem = !ACCEPTED_IMAGE_TYPES.includes(file.type)
          ? "Use JPG, PNG, WebP or AVIF."
          : file.size > MAX_IMAGE_BYTES
            ? "Larger than 4 MB."
            : undefined;
        const item: Item = {
          key,
          src: URL.createObjectURL(file),
          alt: "",
          status: problem ? "error" : "uploading",
          error: problem,
        };
        return { file, item };
      });
    setItems((current) => [...current, ...queued.map((q) => q.item)]);

    // Server Actions run one at a time anyway; await each so progress shows in order.
    for (const { file, item } of queued) {
      if (item.status === "error") continue;
      const body = new FormData();
      body.append("file", file);
      const result = await uploadProductImage(body).catch(() => ({
        ok: false as const,
        error: "Upload failed. Check your connection.",
      }));
      URL.revokeObjectURL(item.src);
      if (result.ok) {
        patch(item.key, { ...result.image, status: "ready", isNew: true });
      } else {
        patch(item.key, { status: "error", error: result.error, src: "" });
      }
    }
  };

  const remove = (item: Item) => {
    setItems((current) => current.filter((i) => i.key !== item.key));
    if (item.src.startsWith("blob:")) URL.revokeObjectURL(item.src);
    if (item.isNew && item.path) void discardUploadedImage(item.path);
  };

  const move = (index: number, delta: number) =>
    setItems((current) => {
      const next = [...current];
      const [moved] = next.splice(index, 1);
      next.splice(index + delta, 0, moved);
      return next;
    });

  const ready = items.filter((item) => item.status === "ready");
  const serialised = JSON.stringify(
    ready.map(({ src, alt, path, printArea }) => ({ src, alt, path, printArea })),
  );

  return (
    <div className="flex flex-col gap-3">
      <input type="hidden" name={name} value={serialised} />
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          void addFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {items.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item, index) => (
            <li
              key={item.key}
              className={cn(
                "flex flex-col overflow-hidden rounded-xl border bg-surface",
                item.status === "error" && "border-red-300",
              )}
            >
              <div className="relative aspect-square bg-surface-tint">
                {item.src && (
                  // Blob previews and storage URLs are shown as-is; next/image isn't needed in admin.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.src}
                    alt={item.alt || `Product image ${index + 1}`}
                    className={cn("h-full w-full object-cover", item.status === "uploading" && "opacity-50")}
                  />
                )}
                {item.status === "uploading" && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-teal" aria-label="Uploading" />
                  </span>
                )}
                {item.status === "error" && (
                  <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-surface/90 p-3 text-center text-xs text-red-700">
                    <TriangleAlert className="h-5 w-5" aria-hidden />
                    {item.error}
                  </span>
                )}
                {index === 0 && item.status === "ready" && (
                  <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-gold px-2 py-0.5 text-[11px] font-semibold text-ink">
                    <Star className="h-3 w-3" aria-hidden /> Cover
                  </span>
                )}
                <div className="absolute right-2 top-2 flex gap-1">
                  <IconButton label="Remove image" onClick={() => remove(item)} disabled={item.status === "uploading"}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </IconButton>
                </div>
              </div>

              {item.status === "ready" && (
                <div className="flex items-center gap-1 border-t p-2">
                  <IconButton label="Move left" onClick={() => move(index, -1)} disabled={index === 0}>
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </IconButton>
                  <input
                    aria-label={`Alt text for image ${index + 1}`}
                    placeholder="Alt text"
                    value={item.alt}
                    onChange={(e) => patch(item.key, { alt: e.target.value })}
                    className={cn(controlClass, "h-8 min-w-0 flex-1 px-2 text-xs")}
                  />
                  <IconButton
                    label="Move right"
                    onClick={() => move(index, 1)}
                    disabled={index === items.length - 1}
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </IconButton>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {items.length < MAX_IMAGES && (
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
            void addFiles(e.dataTransfer.files);
          }}
          className={cn(
            "flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-8 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            dragging ? "border-teal bg-surface-tint" : "border-border bg-surface-tint/40 hover:border-teal",
            invalid && "border-red-400",
          )}
        >
          <ImagePlus className="h-6 w-6 text-teal" aria-hidden />
          <span className="text-sm font-medium text-ink">Click or drop images to upload</span>
          <span className="text-xs text-muted-foreground">
            JPG, PNG, WebP or AVIF · max 4 MB each · up to {MAX_IMAGES} · first image is the cover
          </span>
        </button>
      )}
    </div>
  );
}

function IconButton({
  label,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-surface/90 text-ink shadow-sm transition hover:bg-surface-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40"
      {...props}
    >
      {children}
    </button>
  );
}
