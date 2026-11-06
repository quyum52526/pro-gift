import type { ProductCategory } from "@/types/product";

export interface CategoryFaq {
  question: string;
  answer: string;
}

export interface CategoryContent {
  h1: string;
  /** Meta description, 150-160 characters. */
  description: string;
  intro: string;
  faqs: CategoryFaq[];
}

/*
 * SEO copy for each category page. Only facts the site already states: custom logo branding,
 * bulk corporate orders, delivery across Bangladesh, quotes on WhatsApp, based in Dhaka.
 * No years, clients, delivery times, minimum quantities, discounts or prices.
 */
const CONTENT: Record<string, CategoryContent> = {
  "awards-crests": {
    h1: "Corporate Crests & Awards in Bangladesh",
    description:
      "Corporate crests and awards with your logo, from Pro Gift, a crest maker in Dhaka. Bulk corporate orders, delivery across Bangladesh. Get a quote on WhatsApp.",
    intro:
      "Pro Gift is a crest maker in Dhaka supplying corporate crests and awards branded with your company logo. A corporate crest is a lasting way to recognise employees, thank partners and guests, and mark company milestones, and every piece in this range can carry custom logo branding so it matches your organisation's identity. We take bulk corporate orders and deliver across Bangladesh from our office in Dhanmondi, Dhaka. Browse the crests and awards below and open any product to see its details, branding options and price range. When you find the right design, send us the product code on WhatsApp together with the quantity you need and your logo file, and we will reply with a quote. Whether you need a corporate crest in Bangladesh for an award night, a conference or a farewell, start with the designs below and ask us about branding on WhatsApp.",
    faqs: [
      {
        question: "Can you put our company logo on the crests and awards?",
        answer:
          "Yes. Our crests and awards come with custom logo branding. Send us your logo file and the product code on WhatsApp and we will prepare a quote.",
      },
      {
        question: "Do you take bulk crest orders for award ceremonies and events?",
        answer:
          "Yes, we handle bulk corporate orders. Send us your requirements on WhatsApp: the crest you like, the quantity and your logo.",
      },
      {
        question: "Do you deliver crests outside Dhaka?",
        answer:
          "Yes. We are based in Dhaka and deliver across Bangladesh. For timing on your order, send us your requirements on WhatsApp.",
      },
    ],
  },
  "luxury-boxes": {
    h1: "Corporate Gift Boxes in Bangladesh",
    description:
      "Corporate gift boxes in Bangladesh, branded with your logo. Pick a ready box or build your own. Bulk orders, delivery nationwide, quotes on WhatsApp from Dhaka.",
    intro:
      "Pro Gift supplies corporate gift boxes in Bangladesh for companies that want a gift which looks considered from the moment it is opened. Every corporate gift box can be finished with custom logo branding, so your brand is the first thing the recipient sees. Choose from the boxes below, or use our gift box builder to pick a box, add products from our catalogue and preview it with your logo before you ask for a quote. We take bulk corporate orders for employees, clients and events, and we deliver across Bangladesh from our base in Dhaka. Open any box to see its details, branding options and price range, then send us the product code on WhatsApp with your quantity and logo file. We will reply with a quote. If you have a custom combination in mind, share it with us on WhatsApp and we will help you put the right corporate gift box together.",
    faqs: [
      {
        question: "Can I choose what goes inside the gift box?",
        answer:
          "Yes. Use our gift box builder to pick a box and add products, then send the box to us on WhatsApp for a quote.",
      },
      {
        question: "Can the gift box carry our company logo?",
        answer:
          "Yes. Our gift boxes come with custom logo branding. Share your logo file on WhatsApp and we will include it in your quote.",
      },
      {
        question: "Do you deliver corporate gift boxes across Bangladesh?",
        answer:
          "Yes. We are based in Dhaka and deliver across Bangladesh. For timing on your order, send us your requirements on WhatsApp.",
      },
    ],
  },
  "handcrafted-leather": {
    h1: "Leather Corporate Gifts in Bangladesh",
    description:
      "Leather corporate gifts in Bangladesh, from leather diaries to desk pieces, branded with your logo. Bulk orders, delivery nationwide. Get a quote on WhatsApp.",
    intro:
      "Pro Gift supplies handcrafted leather corporate gifts in Bangladesh, from the leather diary to other everyday pieces your team and clients will keep using. Leather corporate gifts feel personal and professional at the same time, and each product in this range can carry custom logo branding so your company name stays in front of the people who matter to your business. We take bulk corporate orders for staff, clients, partners and events, and we deliver across Bangladesh from our office in Dhaka. Browse the leather gifts below and open any product to see its details, branding options and price range. When you have chosen, send us the product code on WhatsApp with the quantity you need and your logo file, and we will reply with a quote. If you are planning a year-end gift or a welcome kit built around a branded leather diary, start here and ask us about branding on WhatsApp.",
    faqs: [
      {
        question: "Can you brand leather diaries with our logo?",
        answer:
          "Yes. Our leather gifts come with custom logo branding. Open a product to see its branding options, then send us your logo on WhatsApp.",
      },
      {
        question: "Do you take bulk orders for leather corporate gifts?",
        answer:
          "Yes, we handle bulk corporate orders. Send us your requirements on WhatsApp with the product code, quantity and logo file.",
      },
      {
        question: "Can I order a leather gift in a specific colour?",
        answer:
          "Each product page lists its details and specifications. For anything else, send us your requirements on WhatsApp.",
      },
    ],
  },
  "promotional-items": {
    h1: "Promotional Items with Your Logo in Bangladesh",
    description:
      "Promotional items in Bangladesh printed with your logo, for events, campaigns and staff. Bulk corporate orders, delivery nationwide. Get a quote on WhatsApp.",
    intro:
      "Pro Gift supplies promotional items in Bangladesh that carry your logo to events, campaigns, trade shows and office desks. Useful promotional items such as mugs keep your brand in daily view, and every item in this range can be finished with custom logo branding to match your company identity. We take bulk corporate orders for marketing teams, product launches, conferences and staff giveaways, and we deliver across Bangladesh from our base in Dhaka. Browse the promotional items below and open any product to see its details, branding options and price range. When you have found what you need, send us the product code on WhatsApp together with your quantity and logo file, and we will reply with a quote. If you are comparing a few promotional items for one campaign, list them in a single WhatsApp message and we will quote them together, so you can choose the mix that suits your budget and audience.",
    faqs: [
      {
        question: "Can you print our logo on promotional items?",
        answer:
          "Yes. Our promotional items come with custom logo branding. Each product page shows its branding options; send your logo on WhatsApp for a quote.",
      },
      {
        question: "Can I get one quote for several different promotional items?",
        answer:
          "Yes. Send us your requirements on WhatsApp with every product code and quantity, and we will quote them together.",
      },
      {
        question: "Do you deliver promotional items outside Dhaka?",
        answer:
          "Yes. We are based in Dhaka and deliver across Bangladesh. For timing on your order, send us your requirements on WhatsApp.",
      },
    ],
  },
  "tech-electronic": {
    h1: "Tech & Electronic Corporate Gifts in Bangladesh",
    description:
      "Tech and electronic corporate gifts in Bangladesh, including power bank gifts branded with your logo. Bulk orders, delivery nationwide. Quote on WhatsApp.",
    intro:
      "Pro Gift supplies tech and electronic corporate gifts in Bangladesh for teams and clients who live on their devices. Power bank gifts and other tech gifts are used every day, so a logo on them stays visible long after the gift is given. Every product in this range can carry custom logo branding to match your company identity. We take bulk corporate orders for employee gifts, client appreciation, conferences and product launches, and we deliver across Bangladesh from our office in Dhaka. Browse the tech gifts below and open any product to see its details, branding options and price range. When you have chosen, send us the product code on WhatsApp with the quantity you need and your logo file, and we will reply with a quote. If you want to pair a power bank with other items in a branded box, try our gift box builder or describe what you have in mind on WhatsApp.",
    faqs: [
      {
        question: "Can you brand power banks with our company logo?",
        answer:
          "Yes. Our tech gifts come with custom logo branding. Open a product to see its branding options, then send us your logo on WhatsApp.",
      },
      {
        question: "What are the technical specifications of your tech gifts?",
        answer:
          "Each product page lists its specifications. For anything not listed, send us your requirements on WhatsApp.",
      },
      {
        question: "Do you take bulk orders for tech corporate gifts?",
        answer:
          "Yes, we handle bulk corporate orders and deliver across Bangladesh. Send us your requirements on WhatsApp for a quote.",
      },
    ],
  },
  "executive-desk-organizers": {
    h1: "Executive Desk Gift Sets in Bangladesh",
    description:
      "Executive desk gift sets and desk organizer gifts in Bangladesh, branded with your logo. Bulk corporate orders, delivery nationwide. Get a quote on WhatsApp.",
    intro:
      "Pro Gift supplies executive desk gift sets in Bangladesh for senior staff, clients and partners. Desk organizer gifts sit on a desk every working day, which makes them a practical way to keep your brand in view, and each set in this range can carry custom logo branding so it matches your company identity. We take bulk corporate orders for leadership gifts, client appreciation, year-end gifting and events, and we deliver across Bangladesh from our base in Dhaka. Browse the desk sets below and open any product to see its details, branding options and price range. When you have found the right piece, send us the product code on WhatsApp together with your quantity and logo file, and we will reply with a quote. If you need a desk organizer gift for a specific occasion or a set of executives, tell us on WhatsApp and we will help you choose.",
    faqs: [
      {
        question: "Can executive desk sets be branded with our logo?",
        answer:
          "Yes. Our desk gift sets come with custom logo branding. Each product page shows its branding options; send your logo on WhatsApp for a quote.",
      },
      {
        question: "Can I order desk organizer gifts for a whole leadership team?",
        answer:
          "Yes, we handle bulk corporate orders. Send us your requirements on WhatsApp with the product code and quantity.",
      },
      {
        question: "Do you deliver executive desk gifts across Bangladesh?",
        answer:
          "Yes. We are based in Dhaka and deliver across Bangladesh. For timing on your order, send us your requirements on WhatsApp.",
      },
    ],
  },
};

/** Copy for a category added from /admin before it has its own text. */
function fallbackContent(category: ProductCategory): CategoryContent {
  return {
    h1: `${category.name} Corporate Gifts in Bangladesh`,
    description: `${category.name} corporate gifts from Pro Gift, branded with your logo. Bulk corporate orders, delivery across Bangladesh. Get a quote on WhatsApp.`,
    intro: `Pro Gift supplies ${category.name.toLowerCase()} corporate gifts with custom logo branding. We take bulk corporate orders and deliver across Bangladesh from our office in Dhaka. Open any product below to see its details, then send us the product code, quantity and your logo file on WhatsApp for a quote.`,
    faqs: [
      {
        question: "Can you add our company logo?",
        answer: "Yes. Our gifts come with custom logo branding. Send your logo file on WhatsApp for a quote.",
      },
      {
        question: "Do you deliver across Bangladesh?",
        answer: "Yes. We are based in Dhaka and deliver across Bangladesh.",
      },
      {
        question: "How do I get a quote?",
        answer: "Send us your requirements on WhatsApp with the product code and quantity.",
      },
    ],
  };
}

export function categoryContent(category: ProductCategory): CategoryContent {
  return CONTENT[category.slug] ?? fallbackContent(category);
}
