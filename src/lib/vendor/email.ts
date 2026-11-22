import "server-only";

import { SITE_NAME } from "@/lib/site";

/**
 * Server-only key the database checks before it creates or checks a vendor email code.
 * Without it, anyone holding the public anon key could make codes without receiving the email.
 */
export function getVendorServerSecret(): string | null {
  const secret = process.env.VENDOR_SERVER_SECRET?.trim();
  return secret && secret.length >= 32 ? secret : null;
}

export const OTP_SETUP_MISSING =
  "Email codes aren't set up on this site yet. Please message Pro Gift on WhatsApp and we'll help.";

export type OtpPurpose = "signup" | "reset";

const COPY: Record<OtpPurpose, { subject: string; intro: string }> = {
  signup: {
    subject: `Your ${SITE_NAME} vendor code`,
    intro: `Use this code to finish enlisting as a ${SITE_NAME} vendor:`,
  },
  reset: {
    subject: `Reset your ${SITE_NAME} vendor password`,
    intro: "Use this code to set a new password for your vendor account:",
  },
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

/**
 * Sends a 6-digit code with Resend. When RESEND_API_KEY / RESEND_FROM_EMAIL are
 * missing, development prints the code to the server console instead; production
 * returns an error.
 */
export async function sendVendorOtpEmail(
  to: string,
  code: string,
  purpose: OtpPurpose,
): Promise<{ ok: true; devFallback: boolean } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  const copy = COPY[purpose];

  if (!apiKey || !from) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[vendor] RESEND_API_KEY / RESEND_FROM_EMAIL not set. ${purpose} code for ${to}: ${code}`);
      return { ok: true, devFallback: true };
    }
    console.error("[vendor] RESEND_API_KEY or RESEND_FROM_EMAIL is not set; can't send vendor email codes.");
    return { ok: false, error: OTP_SETUP_MISSING };
  }

  const text = `${copy.intro}\n\n${code}\n\nIt expires in 10 minutes. If you didn't ask for it, ignore this email.\n\n${SITE_NAME}`;
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;color:#1f2933;line-height:1.5">
<p>${escapeHtml(copy.intro)}</p>
<p style="font-size:30px;font-weight:bold;letter-spacing:6px;margin:16px 0">${code}</p>
<p>It expires in 10 minutes. If you didn't ask for it, ignore this email.</p>
<p>${escapeHtml(SITE_NAME)}</p>
</div>`;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject: copy.subject, text, html }),
      cache: "no-store",
    });
    if (!response.ok) {
      console.error("[vendor] Resend rejected the email:", response.status, await response.text().catch(() => ""));
      return { ok: false, error: "We couldn't send the email. Check the address and try again in a minute." };
    }
    return { ok: true, devFallback: false };
  } catch (error) {
    console.error("[vendor] Resend request failed:", error);
    return { ok: false, error: "We couldn't send the email. Please try again." };
  }
}
