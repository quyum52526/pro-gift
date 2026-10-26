export type PrintStyle = "colour" | "white" | "engraved";

export interface LogoMockupState {
  /** Object URL of the uploaded file; revoked when replaced or removed. */
  url: string;
  fileName: string;
  /** Logo size as a percent of the print area (40–100). */
  scale: number;
  /** Nudge from centre, as a percent of the print area (-25 to 25). */
  offsetX: number;
  offsetY: number;
  style: PrintStyle;
}

export const PRINT_STYLE_FILTERS: Record<PrintStyle, string> = {
  colour: "none",
  white: "brightness(0) invert(1)",
  engraved: "grayscale(1) contrast(0.9) brightness(1.15)",
};
