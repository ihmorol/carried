# 0001. Sell physical products in Bangladesh

- Status: accepted
- Date: 2026-11-11

## Context

Carried was a free, no-account quote-card site with no way to earn. The cards
are worth holding, and readers in Bangladesh (the site already defaults to
Bangla there) are the audience we can serve well: we can check print quality
locally, and customers expect cash on delivery and bKash.

## Decision

- **Market:** Bangladesh only, for now. Launch target **1 January 2027**, on the
  website and the Android app (see [0005](0005-android-app-at-launch.md)).
- **Digital stays free.** Every card design, PNG and wallpaper is free. The free
  card is the marketing; charging for it would slow the share loop.
- **Products at launch:**
  - stickers of a line, and stickers of just the reader's stamp
  - bookmarks (about 50 × 150 mm)
  - the premium catalog card (3 × 5 in, a real library catalog card)
  - a box of 10–20 cards at Uno size (56 × 87 mm), themed or from the reader's
    own lines
  - "gift a line": shipped to someone else, with a note and no price inside;
    prepaid only
  - a tote bag (one bag colour) and T-shirts (several shirt colours, S to XXL);
    text colour from about six preset swatches, only readable ones per shirt
- **Later:** an affiliate deal with a Bangladeshi online bookstore, replacing
  Bookshop.org, which earns almost nothing here.
- **Two tiers** on cards and boxes: standard and premium share a design and
  differ only in materials. Quality bar for premium: Moo and Minted.
- **Margin:** 60–70% after every cost of an order (print, packaging, gateway
  fee, courier, COD fee, refused deliveries). Prices fixed by 15 December 2026
  from quotes and samples from at least two printers.
- **Production:** third-party printers, every order printed in a weekly batch,
  7–10 days to the door. We pack in our own kraft envelope or box, stamped
  "CARRIED" in red, with the order's accession number stamped by hand. A
  third-party courier delivers.
- **Payment:** cash on delivery, bKash, Nagad and cards through one Bangladeshi
  gateway. COD orders pay the delivery charge up front via bKash or Nagad.
- **Delivery:** two flat rates, inside Dhaka and outside Dhaka.
- **Returns:** damaged or misprinted items replaced free with a photo within 48
  hours of delivery. Custom items can't be returned.
- A Bangladeshi lawyer reviews the terms and privacy policy before launch.

## Consequences

- Carried now holds customer data; [0002](0002-optional-accounts-and-reader-data.md)
  replaces the old "no server-side user data" invariant.
- A fourth rendering surface (print PDFs) appears; see
  [0006](0006-print-pipeline.md).
- Nothing commercial may interrupt the viral loop: no paywall, no signup before
  writing, stamping or sharing.
