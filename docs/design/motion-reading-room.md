# Motion reading room

## Scope
Homepage: Experience, with book discovery and card creation kept immediately operable. The user approved a floating sidebar, the existing two sectors, less explanatory text, closed-book 3D, library graphics, coordinated motion, and an energetic nostalgic theme. Canonical card content, inks, geometry, export parity, bilingual support, and no-account behavior stay intact.

## Current revision: paired discovery, November 2026

The user's screenshots reject the previous sparse-cover shelf, large welcome headline, and decorative cutout bookcase. The replacement is a compact header search beside the wordmark; a single synchronized book-and-line carousel with real closed-book planes; a selection drawer; and a dense, full-width cloth-spine shelf below. The `/books` route uses the dense shelf without the moving hero. The later user approval explicitly permits modernizing all three card renderers together.

The stable visual anchors are the floating rail, warm paper, petrol, persimmon and local bilingual fonts. The homepage headline is now a small orienting sentence. The active book supplies the scene's cloth color. Its title/author/year remain visible. Desktop shows the actual full card; narrow mobile shows the complete quote/name alongside the book and opens the canonical card in a dialog rather than scaling text into illegibility.

One pair is the unit of animation and URL identity. A 9-second idle rotation stops on interaction, focus, hidden page, offscreen hero, open detail and reduced-motion settings. Base UI's modal dialog supplies focus containment, close/Escape and return focus; Motion supplies paired enter/exit. No random book/line mismatch, scroll hijacking or continuously animated catalog. Header and catalog query share one URL/event contract.

Bookplate becomes a modern open left-aligned print composition. Publication year is measured in shared credit text and dense clearances are verified across DOM/PNG/OG. Keep full text, original identity and the same ink/edition IDs. The previous direction below is retained only as rejected design history, not current authority.

Featured cards now sit on a **stage** (`TiltCard` + `stage.css`): a perspective wrapper leans the object toward a fine pointer (max 6°, rAF-batched into three CSS variables), a two-sheet raised-paper stack backs it, and one blurred `--color-shadow` ellipse is the contact shadow. When a stage first enters the viewport it lands once — a 16px lift settling over the new `--ease-settle` (620ms, landings only) with the shadow blooming in the final third; the SSR/no-JS default is the landed card, and reduced motion or a paused/reduced room keeps it at rest. Reader-line grids get the flat treatment instead: `--shadow-card-rest` at rest, a 3px lift with `--shadow-card-lift` on hover/focus, no 3D and no blur. The four new tokens (`--ease-settle`, `--dur-land`, `--shadow-card-rest`, `--shadow-card-lift`) are recorded in `DESIGN.md`.

## Previous direction contract (superseded)

**THESIS:** A book becomes a personal keepsake. The real cover and actual reader card lead; no generic marketing hero, feature tiles, statistics, decorative labels, or fake social proof.

**OWN-WORLD:** Butter-paper discovery, a committed petrol-teal line sector, persimmon actions, and pistachio bookcase planes. The local Noto Serif Bengali display face and Manrope/Anek Bangla interface pair remain. Physical book edges create depth, not gradients or glass.

**STORY:** Find a familiar book, see what another reader carried from it, write your own line, and keep or share the card.

**FIRST VIEWPORT:** A detached navigation rail; left search, short welcome, large closed-book scene and writing action; right a cream-on-teal heading and canonical portrait card with quiet paper/book depth. Library geometry joins the objects to their backgrounds. Mobile retains writing access before the catalogue.

**FORM:** User-pinned reading-room split, overriding free direction selection. Impeccable direction seed `a02ea708` was consulted; the approved structure/palette take precedence over the assigned index and unrelated challengers. The useful raised bar is color commitment at section scale and precise physical layers, not borrowed motifs.

**MOTION:** One coordinated arrival leads with the featured book. Closed decorative books and their supporting shadows move slowly in bounded arcs; reading text is stable. Transform/opacity only. A visible pause control, live reduced-motion support, offscreen/hidden-page pausing, static fallback, and no animation-gated content.

**FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Sources and limits
- LottieFiles `motion-design`, MIT, inspected from https://github.com/LottieFiles/motion-design-skill.git in an isolated temporary directory. Apply its primary/secondary/ambient staging, shared easing, and bounded choreography; no runtime or downloaded script is needed.
- UI/UX Pro Max recommendations inform accessibility/performance, not a replacement for the approved composition or local fonts.
- Impeccable craft-floor, `animate`, `better-colors`, and Carried's visual-QA contract govern implementation.
- Existing cover URLs and authored fallbacks retain provenance; no new photographic or merchandise assets are claimed. All library/depth geometry is authored presentation.
- Palette appeal is a design hypothesis, not a measured acquisition or demographic claim.
