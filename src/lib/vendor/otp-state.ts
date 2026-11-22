import type { ActionState } from "@/lib/admin/form-state";

/** State of a "send me a code" step: once a code is sent, the form moves to entering it. */
export interface OtpStartState extends ActionState {
  step?: "code";
  requestId?: string;
  /** Where the code went (shown on signup; reset only says "the email on your account"). */
  email?: string;
}

export const IDLE_OTP_STATE: OtpStartState = { status: "idle" };
