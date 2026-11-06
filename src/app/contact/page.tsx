import type { Metadata } from "next";

import { WhatsAppIcon } from "@/components/product/whatsapp-icon";
import { DEFAULT_OG_IMAGE, OPEN_GRAPH_DEFAULTS, SITE_ADDRESS, SITE_CONTACT } from "@/lib/site";
import { buildGeneralWhatsAppUrl } from "@/lib/whatsapp";

const TITLE = "Contact Pro Gift | Corporate Gifts in Dhaka, Bangladesh";
const DESCRIPTION =
  "Contact Pro Gift, corporate gift supplier in Dhanmondi, Dhaka. Custom logo-branded corporate gifts delivered across Bangladesh. Call, WhatsApp or email us.";

export const metadata: Metadata = {
  // Absolute: the full title already names the brand, so skip the "| Pro Gift" template.
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/contact" },
  openGraph: {
    ...OPEN_GRAPH_DEFAULTS,
    title: TITLE,
    description: DESCRIPTION,
    url: "/contact",
    images: [DEFAULT_OG_IMAGE],
  },
};

export default function ContactPage() {
  const whatsappUrl = buildGeneralWhatsAppUrl();

  const details = [
    { label: "Address", value: SITE_ADDRESS.full, href: SITE_ADDRESS.mapsHref, external: true },
    { label: "Phone", value: SITE_CONTACT.phone.label, href: SITE_CONTACT.phone.href, external: false },
    { label: "Email", value: SITE_CONTACT.email, href: `mailto:${SITE_CONTACT.email}`, external: false },
  ];

  return (
    <main className="flex-1">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-12 px-4 py-14 sm:px-6 sm:py-[72px]">
        <header className="flex max-w-[760px] flex-col gap-4">
          <h1 className="text-[clamp(30px,4.6vw,44px)] leading-[1.18] font-bold text-ink">
            Contact Pro Gift – Corporate Gift Supplier in Dhaka
          </h1>
          <p className="text-base leading-7 text-muted-foreground">
            We supply custom logo-branded corporate gifts, from crests and awards to diaries, mugs, power banks
            and gift boxes, and deliver across Bangladesh. Call, WhatsApp or email us for a bulk quote.
          </p>
        </header>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <section aria-labelledby="contact-details" className="flex flex-col gap-6">
            <h2 id="contact-details" className="text-xs font-semibold tracking-[0.08em] text-teal uppercase">
              Get in touch
            </h2>
            <address className="not-italic">
              {/* Bottom padding leaves room for the tiles' 3D edge. */}
              <ul className="flex flex-col gap-[22px] pb-1.5">
                {details.map((detail) => (
                  <li key={detail.label} className="flex">
                    <a
                      href={detail.href}
                      {...(detail.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      className="pg-tile flex-1"
                    >
                      <span className="text-xs font-semibold tracking-[0.08em] uppercase">{detail.label}</span>
                      <span className="text-[15px] leading-[22px] font-medium">{detail.value}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </address>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="pg-btn self-start bg-whatsapp text-surface shadow-[0_5px_0_var(--color-whatsapp-dark)] hover:shadow-[0_8px_0_var(--color-whatsapp-dark)]"
            >
              <WhatsAppIcon className="size-5" />
              Chat on WhatsApp
            </a>
            <p className="text-sm leading-5 text-muted-foreground">
              Service area: All of {SITE_CONTACT.areaServed}
            </p>
          </section>

          <section aria-label="Map" className="overflow-hidden rounded-2xl border border-hairline bg-surface-tint">
            <iframe
              src={SITE_ADDRESS.mapsEmbed}
              title="Pro Gift location on Google Maps – 19 Green Road, Dhanmondi, Dhaka 1205"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
              className="block aspect-[4/3] h-auto w-full border-0 lg:aspect-auto lg:h-full lg:min-h-[420px]"
            />
          </section>
        </div>
      </div>
    </main>
  );
}
