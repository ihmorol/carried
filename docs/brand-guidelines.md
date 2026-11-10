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

Manrope and Anek Bangla, locally hosted at 400/500/600. Bengali uses normal letter spacing and script-safe line height. Latin prose and all card metadata also use normal tracking. No forced italic quotes, all-caps ledger labels, tiny monospace prose, or excessive letter spacing.

The former Fraunces/Plex letterpress system is superseded by the user's explicit typography revision. Research and full font licensing details are recorded in `docs/design/modern-bangla-typography.md`; the active system is in `DESIGN.md`.

## Signature elements

1. The authored line, book title/author, and reader name/date remain complete on every edition; the year stays in the payload and page metadata.
2. Editions carry their own ownership marks: the Bookplate's oval seal, the Poster's angled stamp, the Reader's ticket's circular cancellation. Each makes the card feel personally claimed.
3. The accession number remains derived from the line's identity.
4. Edition geometry (frames, bands, notches, seals) belongs to its own design, never accumulated across cards.
5. The shelf shows front-facing covers resolved through the bounded, identity-checked route with labeled authored fallbacks. Cover art is display-only; publisher covers never appear on merchandise.

## Layout and interaction

The home is a whole-page shelf/lines split, not another marketing hero. The sidebar is narrow with regular outline icons, a coral active circle, and a bottom hamburger that reveals labels. Preserve accessible labels and keyboard use in both sizes. On mobile, stack the sectors and provide clear jump links.

Collectible artwork keeps its approved 4:5 composition. Fit full valid content within the edition's text regions; do not stretch or distribute those groups to fill a page panel. Page utilities and readable companion provenance remain outside the artwork. DOM, PNG, OG, and merchandise previews share content/type decisions. Respect reduced motion; never animate readable cards continuously.

## Boundaries

No accounts, tracking, new locale cookies, gradients, or glass. The personal shelf and merchandise concept cart remain device-local. Physical ordering remains disabled until business, fulfillment, payment, rights, and policy details are supplied and approved.
