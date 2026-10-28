import { WHATSAPP_NUMBER } from "./whatsapp";

/** Public contact details shown in the footer. */
export const SITE_CONTACT = {
  whatsapp: { label: `+${WHATSAPP_NUMBER}` },
  email: "quyum52526@gmail.com",
  website: { href: "https://www.progift.com.bd", label: "www.progift.com.bd" },
  facebook: { href: "https://www.facebook.com/progiftbd", label: "facebook.com/progiftbd" },
} as const;
