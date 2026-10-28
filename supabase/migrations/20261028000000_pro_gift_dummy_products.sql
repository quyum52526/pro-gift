-- Sample catalogue: brings every category up to at least three products.
--
-- Run after 20261026000000_pro_gift_catalog.sql. Safe to re-run: rows whose
-- slug already exists are skipped, so products edited in /admin are untouched.
-- Images are bundled in /public/products, so `src` is a site-relative path.

begin;

insert into public.products (
  slug, code, name, category_id, short_description, description,
  price_min, price_max, moq, lead_time, specs, branding_methods, images
) values
(
  'leather-business-card-holder', 'PG-LTH-211', 'Leather Business Card Holder',
  (select id from public.categories where slug = 'handcrafted-leather'),
  'Slim genuine-leather card holder with hand-stitched edges.',
  'A slim card holder cut from full-grain cowhide, hand-stitched along the edges and finished with burnished sides. It holds up to 15 business cards and slips easily into a jacket pocket. A blind deboss or foil stamp on the front panel gives it a quiet, premium look.',
  550, 1100, 50, '7–10 working days',
  '[{"label":"Material","value":"Full-grain cowhide"},{"label":"Capacity","value":"Up to 15 cards"},{"label":"Size","value":"10.5 × 7 cm"}]',
  array['Deboss', 'Gold / silver foil', 'Laser engraving'],
  '[{"src":"/products/leather-business-card-holder.svg","alt":"Tan leather business card holder","printArea":{"x":36.3,"y":41,"width":27.5,"height":11}}]'
),
(
  'leather-key-ring', 'PG-LTH-215', 'Leather Key Ring',
  (select id from public.categories where slug = 'handcrafted-leather'),
  'Hand-cut leather key fob with a solid brass split ring.',
  'A hand-cut leather key fob with a stitched loop and a solid brass split ring that will not tarnish quickly. Small, useful and carried every day, it keeps your logo in sight long after the event. Popular for dealer meets, property handovers and car showroom gifting.',
  180, 420, 100, '5–7 working days',
  '[{"label":"Material","value":"Vegetable-tanned leather"},{"label":"Hardware","value":"Solid brass ring"},{"label":"Size","value":"9 × 3.5 cm"}]',
  array['Deboss', 'Hot foil', 'Laser engraving'],
  '[{"src":"/products/leather-key-ring.svg","alt":"Dark brown leather key ring with brass ring","printArea":{"x":43.8,"y":47,"width":12.5,"height":23}}]'
),
(
  'metal-ballpoint-pen', 'PG-PEN-120', 'Metal Ballpoint Pen',
  (select id from public.categories where slug = 'promotional-items'),
  'Twist-action aluminium ballpoint pen with smooth blue ink.',
  'A balanced aluminium ballpoint pen with a twist mechanism, chrome trim and a smooth-writing blue refill. Laser engraving cuts cleanly through the anodised barrel for a sharp, permanent logo. An easy add-on for conferences, seminars and welcome kits.',
  120, 380, 100, '5–7 working days',
  '[{"label":"Material","value":"Anodised aluminium"},{"label":"Ink","value":"Blue, 1.0 mm"},{"label":"Print area","value":"4 × 0.7 cm"}]',
  array['Laser engraving', 'Pad print', 'UV print'],
  '[{"src":"/products/metal-ballpoint-pen.svg","alt":"Teal metal ballpoint pen","printArea":{"x":41.3,"y":44,"width":17.5,"height":9}}]'
),
(
  'slim-power-bank-10000', 'PG-TEC-401', 'Slim Power Bank 10,000 mAh',
  (select id from public.categories where slug = 'tech-electronic'),
  '10,000 mAh power bank with USB-C fast charging and an aluminium shell.',
  'A slim 10,000 mAh power bank in a brushed aluminium shell with USB-C in/out and an extra USB-A port. It charges a phone around two to three times and has a four-LED charge indicator. The flat face takes laser engraving or full-colour UV print for a clean logo.',
  1450, 2600, 20, '10–14 working days',
  '[{"label":"Capacity","value":"10,000 mAh"},{"label":"Ports","value":"USB-C PD 20 W · USB-A"},{"label":"Size","value":"14 × 7 × 1.4 cm"}]',
  array['Laser engraving', 'UV print'],
  '[{"src":"/products/slim-power-bank-10000.svg","alt":"Dark grey slim power bank","printArea":{"x":38.8,"y":38,"width":22.5,"height":16}}]'
),
(
  'wireless-charging-pad', 'PG-TEC-405', '15 W Wireless Charging Pad',
  (select id from public.categories where slug = 'tech-electronic'),
  'Qi-certified 15 W wireless charger with a non-slip fabric top.',
  'A round 15 W Qi wireless charging pad with a soft fabric top, non-slip base and a soft status light. It works with recent iPhone and Android phones and comes with a USB-C cable. Your logo is printed or engraved on the top ring, right where it is seen on the desk.',
  1100, 2100, 25, '10–14 working days',
  '[{"label":"Output","value":"15 W Qi"},{"label":"Input","value":"USB-C, cable included"},{"label":"Diameter","value":"10 cm"}]',
  array['UV print', 'Laser engraving'],
  '[{"src":"/products/wireless-charging-pad.svg","alt":"Round white wireless charging pad","printArea":{"x":40,"y":53,"width":20,"height":8}}]'
),
(
  'metal-usb-flash-drive', 'PG-TEC-410', 'Metal USB Flash Drive 32 GB',
  (select id from public.categories where slug = 'tech-electronic'),
  '32 GB swivel USB 3.0 flash drive in polished metal.',
  'A compact 32 GB USB 3.0 flash drive with a metal swivel cover that protects the connector and doubles as a key-ring loop. Fast enough for presentations and media files, and pre-loading of your company profile is available on request.',
  450, 900, 50, '7–10 working days',
  '[{"label":"Capacity","value":"32 GB"},{"label":"Interface","value":"USB 3.0"},{"label":"Material","value":"Zinc alloy swivel"}]',
  array['Laser engraving', 'Pad print'],
  '[{"src":"/products/metal-usb-flash-drive.svg","alt":"Silver metal swivel USB flash drive","printArea":{"x":41.3,"y":36,"width":17.5,"height":22}}]'
),
(
  'walnut-desk-organizer', 'PG-DSK-501', 'Walnut Desk Organizer',
  (select id from public.categories where slug = 'executive-desk-organizers'),
  'Solid walnut organizer with pen, phone and card slots.',
  'A solid walnut desk organizer with compartments for pens, a phone stand slot, a card holder and a small tray for clips. Each piece is sanded and oiled by hand, so the grain varies a little from one to the next. A laser-engraved logo on the front edge looks right at home on an executive desk.',
  1800, 3500, 15, '12–15 working days',
  '[{"label":"Material","value":"Solid walnut, oil finish"},{"label":"Compartments","value":"4"},{"label":"Size","value":"24 × 10 × 9 cm"}]',
  array['Laser engraving', 'Brass plate'],
  '[{"src":"/products/walnut-desk-organizer.svg","alt":"Walnut wood desk organizer with compartments","printArea":{"x":33.8,"y":54,"width":32.5,"height":12}}]'
),
(
  'bamboo-pen-stand', 'PG-DSK-505', 'Bamboo Pen Stand',
  (select id from public.categories where slug = 'executive-desk-organizers'),
  'Eco-friendly bamboo pen cup with a built-in phone slot.',
  'A round pen cup made from natural bamboo with a built-in phone slot on the side. It is light, sturdy and an easy eco-friendly choice for desk gifting. Laser engraving darkens the bamboo for a warm, natural logo finish.',
  380, 750, 50, '7–10 working days',
  '[{"label":"Material","value":"Natural bamboo"},{"label":"Size","value":"8 × 8 × 10 cm"},{"label":"Extras","value":"Phone slot"}]',
  array['Laser engraving', 'UV print'],
  '[{"src":"/products/bamboo-pen-stand.svg","alt":"Natural bamboo pen stand","printArea":{"x":37.5,"y":49,"width":25,"height":11}}]'
),
(
  'leatherette-desk-mat', 'PG-DSK-510', 'Leatherette Desk Mat',
  (select id from public.categories where slug = 'executive-desk-organizers'),
  'Large water-resistant PU desk mat with stitched edges.',
  'A large desk mat in water-resistant PU leatherette with stitched edges and a non-slip suede-feel base. It protects the desk, works as a mouse pad and rolls up for shipping. A debossed or foil logo in one corner keeps it understated.',
  950, 1800, 25, '7–10 working days',
  '[{"label":"Material","value":"PU leatherette"},{"label":"Size","value":"80 × 40 cm"},{"label":"Base","value":"Non-slip suede-feel"}]',
  array['Deboss', 'Gold / silver foil'],
  '[{"src":"/products/leatherette-desk-mat.svg","alt":"Black leatherette desk mat","printArea":{"x":23.8,"y":56,"width":27.5,"height":10}}]'
),
(
  'crystal-star-award', 'PG-AWD-601', 'Crystal Star Award',
  (select id from public.categories where slug = 'awards-crests'),
  'Optical crystal star award on a black crystal base, in a gift box.',
  'A star-shaped optical crystal award mounted on a black crystal base, supplied in a satin-lined gift box. Names, titles and logos are laser-etched inside the crystal for a frosted, permanent finish. Made for annual awards, top-performer recognition and long-service honours.',
  1500, 4500, 5, '7–10 working days',
  '[{"label":"Material","value":"K9 optical crystal"},{"label":"Height","value":"20 cm"},{"label":"Packaging","value":"Satin-lined box"}]',
  array['Laser etching', 'Colour UV print'],
  '[{"src":"/products/crystal-star-award.svg","alt":"Clear crystal star award on a black base","printArea":{"x":41.3,"y":38,"width":17.5,"height":12}}]'
),
(
  'wooden-honour-crest', 'PG-AWD-605', 'Wooden Honour Crest',
  (select id from public.categories where slug = 'awards-crests'),
  'Shield-shaped wooden crest with a gold-tone metal plate.',
  'A shield-shaped crest in polished hardwood with a gold-tone metal plate for your logo and citation, plus a fold-out stand and wall hook. A classic choice for guest-of-honour presentations, seminars and institutional events in Bangladesh.',
  900, 2200, 10, '5–7 working days',
  '[{"label":"Material","value":"Polished hardwood"},{"label":"Plate","value":"Gold-tone brass"},{"label":"Size","value":"25 × 20 cm"}]',
  array['Laser engraving', 'Colour print on plate'],
  '[{"src":"/products/wooden-honour-crest.svg","alt":"Wooden shield crest with gold plate","printArea":{"x":38.8,"y":34,"width":22.5,"height":20}}]'
),
(
  'metal-cup-trophy', 'PG-AWD-610', 'Gold-Tone Cup Trophy',
  (select id from public.categories where slug = 'awards-crests'),
  'Gold-tone metal cup trophy with handles on a marble-effect base.',
  'A gold-tone metal cup trophy with twin handles on a heavy marble-effect base. The front of the base carries an engraved plate with the event, year and your logo. Ideal for sports days, sales contests and tournament finals.',
  1200, 3800, 5, '7–10 working days',
  '[{"label":"Material","value":"Metal cup, resin base"},{"label":"Height","value":"35 cm"},{"label":"Plate","value":"Engraved brass"}]',
  array['Laser engraving', 'Colour print on plate'],
  '[{"src":"/products/metal-cup-trophy.svg","alt":"Gold cup trophy on a dark base","printArea":{"x":41.3,"y":66,"width":17.5,"height":7}}]'
),
(
  'magnetic-rigid-gift-box', 'PG-BOX-701', 'Magnetic Rigid Gift Box',
  (select id from public.categories where slug = 'luxury-boxes'),
  'Rigid book-style gift box with a magnetic flap and satin ribbon.',
  'A rigid 1,200 gsm board gift box wrapped in soft-touch paper, with a magnetic closure flap and a satin pull ribbon. Custom foam or card inserts can be cut to fit your products. Foil-stamped or embossed logos turn plain packaging into part of the gift.',
  250, 650, 100, '10–12 working days',
  '[{"label":"Board","value":"1,200 gsm rigid"},{"label":"Finish","value":"Soft-touch lamination"},{"label":"Size","value":"Custom, from 15 × 10 × 5 cm"}]',
  array['Gold / silver foil', 'Emboss', 'Spot UV'],
  '[{"src":"/products/magnetic-rigid-gift-box.svg","alt":"Teal rigid gift box with magnetic flap","printArea":{"x":28.8,"y":52,"width":17.5,"height":12}}]'
),
(
  'executive-gift-set-box', 'PG-BOX-705', 'Executive Gift Set Box',
  (select id from public.categories where slug = 'luxury-boxes'),
  'Curated set of diary, pen and card holder in a presentation box.',
  'A ready-to-give executive set with an A5 diary, a metal pen and a card holder, nested in a velvet-lined presentation box. Every item can carry your logo, and the outer sleeve can be printed with a message. Our most requested set for Eid, year-end and VIP client gifting.',
  2500, 5500, 10, '10–14 working days',
  '[{"label":"Contents","value":"Diary, pen, card holder"},{"label":"Box","value":"Velvet-lined rigid box"},{"label":"Size","value":"32 × 24 × 6 cm"}]',
  array['Gold / silver foil', 'Laser engraving', 'Deboss'],
  '[{"src":"/products/executive-gift-set-box.svg","alt":"Open black presentation box with diary, pen and card holder","printArea":{"x":27.5,"y":50,"width":20,"height":12}}]'
),
(
  'wooden-hamper-box', 'PG-BOX-710', 'Wooden Hamper Box',
  (select id from public.categories where slug = 'luxury-boxes'),
  'Pine wood hamper box with sliding lid, ready for food or gift sets.',
  'A sturdy pine wood hamper box with a sliding lid and rope handles, sized for festive food hampers, tea sets or curated gift bundles. The box is reusable long after the gift is opened, so a laser-engraved or printed lid logo keeps working for years.',
  1200, 2800, 20, '12–15 working days',
  '[{"label":"Material","value":"Natural pine wood"},{"label":"Lid","value":"Sliding"},{"label":"Size","value":"35 × 25 × 12 cm"}]',
  array['Laser engraving', 'Screen print', 'Branded sleeve'],
  '[{"src":"/products/wooden-hamper-box.svg","alt":"Natural pine wood hamper box with rope handles","printArea":{"x":33.8,"y":54,"width":32.5,"height":14}}]'
)
on conflict (slug) do nothing;

commit;
