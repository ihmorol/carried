# Carried brand guidelines

The identity in one sentence: **the line a book left in you, made yours.**

## Voice

Warm, direct, literary without ornament. Use plain action labels and short sentences. No fake urgency, fake statistics, promises of virality, or sales claims for unlaunched products. Digital creation, all three styles, downloading, and sharing remain free.

## Palette

The reading reference defines a pale-neutral shelf and a near-white line sector. Use charcoal text and one coral accent family.

| Token | Hex | Use |
|---|---|---|
| paper | `#f1f1e7` | shelf/page background |
| paper-raised | `#fffefa` | line sector, inputs, paper card |
| surface-soft | `#e7e8df` | quiet grouping |
| ink | `#26292f` | primary text and controls |
| ink-soft | `#60646c` | supporting text |
| ink-faint | `#6b7077` | readable placeholders |
| rule | `#dbddd4` | separators |
| stamp | `#bf4654` | readable accent text and focus |
| accent | `#e66b77` | active sidebar circle |
| stamp-soft | `#f5d9dd` | selected-control tint |

The `paper`, `midnight`, and `moss` style identifiers remain stable. Their exact artwork colors come from `lib/inks.ts`. Moss is pale sage. Colorful book cloth is content, not a license for rainbow UI controls.

## Type

Three faces, locally hosted as static OFL-licensed instances at 400/500/600. Noto Serif Bengali is the display voice: headlines, section titles, and the card's quote, book title, and wordmark — one face covering both Bengali and Latin glyphs. Manrope (Latin) and Anek Bangla (Bengali) remain the interface voice for UI, body, labels, metadata, and reader names; on the card, labels, reader name, author, date, and accession stay sans for legibility at 8–12px. Bengali uses normal letter spacing and script-safe line height everywhere. Serif display tracking is at most -0.01em; Bengali display tracking stays normal. Latin prose and all card metadata also use normal tracking. No forced italic quotes, all-caps ledger labels, tiny monospace prose, or excessive letter spacing.

The former Fraunces/Plex letterpress system is superseded by the user's explicit typography revision. In November 2026 that revision was itself updated: Noto Serif Bengali joins as the display voice, superseding the earlier keep-only-the-pair rule for display; the Manrope/Anek Bangla pair remains the interface voice. Research and full font licensing details are recorded in `docs/design/modern-bangla-typography.md`; the active system is in `DESIGN.md`.

## Signature elements

1. The authored line, book title/author, and reader name/date remain complete on every edition; the year stays in the payload and page metadata.
2. Editions carry their own ownership marks, set in type with one coral accent: the Bookplate's coral signature rule under the reader's name, the Poster's coral band credit line, and the Reader's ticket's single-ring circular cancellation. Each makes the card feel personally claimed without certificate ornaments.
3. The accession number remains derived from the line's identity.
4. Edition geometry (frames, bands, notches, seals) belongs to its own design, never accumulated across cards.
5. The shelf shows front-facing covers resolved through the bounded, identity-checked route with labeled authored fallbacks. Cover art is display-only; publisher covers never appear on merchandise.

## Layout and interaction

The home is a whole-page shelf/lines split, not another marketing hero. The sidebar is narrow with regular outline icons, a coral active circle, and a bottom hamburger that reveals labels. Preserve accessible labels and keyboard use in both sizes. On mobile, stack the sectors and provide clear jump links.

Collectible artwork keeps its approved 4:5 composition. Fit full valid content within the edition's text regions; do not stretch or distribute those groups to fill a page panel. Short quotes use a controlled hierarchy, with explicit long-content fitting and clearance between groups. The featured-book group and composer do not need enclosing panels. Keep Save visually primary and offer mobile writing access before the catalogue. Page utilities and readable companion provenance remain outside the artwork. DOM, PNG, OG, and merchandise previews share content/type decisions. Respect reduced motion; never animate readable cards continuously.

## Boundaries

No accounts, tracking, new locale cookies, gradients, or glass. The personal shelf and merchandise concept cart remain device-local. Physical ordering remains disabled until business, fulfillment, payment, rights, and policy details are supplied and approved.
