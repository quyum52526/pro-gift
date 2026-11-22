"use client";

import * as React from "react";
import { ImagePlus, Loader2, Store, Trash2 } from "lucide-react";

import { uploadVendorImage } from "@/app/vendor/actions";
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/admin/form-state";

interface LogoUploaderProps {
  /**
   * "upload": the file is uploaded straight away and its storage path is kept in a
   * hidden `logo_path` input (signed-in vendors). "file": the file is submitted with
   * the form as `logo` (enlistment, before the vendor has a session).
   */
  mode: "upload" | "file";
  initialUrl?: string | null;
  initialPath?: string | null;
  error?: string;
  onBusyChange?: (busy: boolean) => void;
}

export function LogoUploader({ mode, initialUrl = null, initialPath = null, error, onBusyChange }: LogoUploaderProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [preview, setPreview] = React.useState<string | null>(initialUrl);
  const [path, setPath] = React.useState<string | null>(initialPath);
  const [busy, setBusy] = React.useState(false);
  const [problem, setProblem] = React.useState<string | undefined>();

  React.useEffect(() => onBusyChange?.(busy), [busy, onBusyChange]);

  const reject = (reason: string) => {
    setProblem(reason);
    // Don't submit a file the server will refuse.
    if (inputRef.current) inputRef.current.value = "";
  };

  const choose = async (file: File | undefined) => {
    setProblem(undefined);
    if (!file) return;
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return reject("Use JPG, PNG, WebP or AVIF.");
    if (file.size > MAX_IMAGE_BYTES) return reject("Logo is larger than 4 MB.");

    if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    const blob = URL.createObjectURL(file);
    setPreview(blob);
    if (mode === "file") return;

    setBusy(true);
    const body = new FormData();
    body.append("file", file);
    const result = await uploadVendorImage(body).catch(() => ({
      ok: false as const,
      error: "Upload failed. Check your connection.",
    }));
    setBusy(false);
    if (result.ok) {
      setPath(result.image.path);
    } else {
      setProblem(result.error);
      setPreview(initialUrl);
      setPath(initialPath);
    }
  };

  const clear = () => {
    if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    setPreview(null);
    setPath(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const message = problem ?? error;

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-ink">Logo</span>
      <div className="flex items-center gap-4">
        <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-surface-tint">
          {preview ? (
            // Blob previews and storage URLs are shown as-is.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Logo preview" className="h-full w-full object-contain p-1" />
          ) : (
            <Store className="h-8 w-8 text-teal" aria-hidden />
          )}
          {busy && (
            <span className="absolute inset-0 flex items-center justify-center bg-surface/70">
              <Loader2 className="h-5 w-5 animate-spin text-teal" aria-label="Uploading" />
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-input bg-surface px-3 text-sm font-medium text-ink transition hover:border-teal disabled:opacity-50"
          >
            <ImagePlus className="h-4 w-4 text-teal" aria-hidden />
            {preview ? "Change logo" : "Upload logo"}
          </button>
          {preview && (
            <button
              type="button"
              onClick={clear}
              disabled={busy}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm text-muted-foreground transition hover:text-ink disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" aria-hidden /> Remove
            </button>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        name={mode === "file" ? "logo" : undefined}
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        className="sr-only"
        tabIndex={-1}
        aria-label="Logo file"
        onChange={(event) => void choose(event.target.files?.[0])}
      />
      {mode === "upload" && <input type="hidden" name="logo_path" value={path ?? ""} />}
      {message ? (
        <p className="text-xs text-red-700">{message}</p>
      ) : (
        <p className="text-xs text-muted-foreground">Optional. Square JPG, PNG, WebP or AVIF, max 4 MB.</p>
      )}
    </div>
  );
}
