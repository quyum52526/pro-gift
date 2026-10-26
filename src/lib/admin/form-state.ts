/** Result returned by admin Server Actions to `useActionState`. */
export interface ActionState {
  status: "idle" | "success" | "error";
  message?: string;
  /** Per-field messages, keyed by the form field name. */
  fieldErrors?: Partial<Record<string, string>>;
}

export const IDLE_STATE: ActionState = { status: "idle" };

export type UploadResult =
  | { ok: true; image: { src: string; path: string } }
  | { ok: false; error: string };

export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
export const MAX_IMAGES = 8;
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
