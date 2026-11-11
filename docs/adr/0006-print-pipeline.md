# 0006. Print pipeline: print PDFs as a fourth rendering surface

- Status: accepted
- Date: 2026-11-11

## Context

Physical products need print-ready files at sizes the screen card never used
(the on-screen card is 4:5). The three existing surfaces (DOM card, PNG, OG
image) already must match; printed products have to match them too.

## Decision

- **Print-ready PDFs** for every product format, built from the same design
  source as the other surfaces (the inks in `lib/inks.ts` and the card
  layout the DOM, PNG and OG renderers share), never a separate copy of the
  design.
- **Physical sizes:** box cards 56 × 87 mm (Uno size), premium card 3 × 5 in,
  bookmark about 50 × 150 mm, plus sticker, tote and T-shirt layouts.
- **Exact preview before paying:** custom items show at their real printed size
  and layout, with a "This is what we'll print" tick required before payment.
  This backs the no-returns rule for custom items.
- **Admin page:** lists paid orders and produces the PDFs for each weekly batch,
  which are sent to the printer by hand. No integration with printer systems.

## Consequences

- A card-design change must update four surfaces, not three. `AGENTS.md`
  non-negotiable #2 says so.
- The preview and the PDF should come from one renderer so they can't differ.
