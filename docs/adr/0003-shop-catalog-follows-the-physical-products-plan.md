# 0003 — The shop catalog follows the physical-products plan

Date: 2026-11-20 · Status: accepted

## Context

`business-research/physical-products-bd.md` (11 Nov 2026) plans Carried's physical
line: quote card, bookmark, bookplate set, framed print, gift set (hero), and a
book-fair/club bulk pack, priced in taka and produced via Dhaka digital presses.
The concept storefront built in
[0002](0002-free-digital-local-merchandise.md) carried a different, exploratory
set: art print, bookmark, tote, notebook, mug.

## Decision

The concept catalog (`src/lib/commerce/catalog.ts`) is aligned to the planned
assortment: `quote-card`, `bookmark`, `bookplate-set`, `framed-print`, `gift-set`,
`club-pack`. Product copy describes identity only (what the object is for), never
materials, sizes, contents counts, or prices — those remain launch decisions and
`PRODUCT.md` forbids inventing them. The featured concept on `/shop` is the gift
set, the plan's hero product.

The card-to-shop pathway deepens: `/l/[id]` links "Print this card" to
`/shop/quote-card` (the one-to-one print of a card), the home line drawer gains
the same entry, and a quiet "print concepts" prompt appears after a successful
PNG download. The old slugs are removed; a persisted concept cart holding them
fails validation and resets through the existing corrupt-cart recovery, which is
acceptable because the cart never held orders.

## Consequences

- Ordering, prices, production specs, rights review, and PII remain out of scope;
  opening any of them still requires its own ADR and the brand boundary stays:
  physical ordering is disabled until business, fulfillment, payment, rights, and
  policy details are supplied and approved.
- Reader-facing copy keeps the honest "ordering is not open" state on every shop
  surface; digital cards stay free and downloads never gate on the shop.
- The cart identity schema (`carried.cart.v1`) and validation semantics are
  unchanged; only the accepted `productSlug` domain moved.
