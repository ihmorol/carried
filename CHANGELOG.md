# Changelog

All notable changes to Carried are recorded here. Digital cards stay free in every version.

## [0.2.0] - 2026-11-21

### Added

- Collectible card editions: every line renders as Bookplate, Poster, or Reader's Ticket across the DOM card, the PNG download, and link previews; the edition rides inside the payload and readers can restyle an existing line into a new edition.
- The reading room shop: six planned print products (quote card, bookmark, bookplate set, framed print, gift set, book club pack) presented as flat concept proofs with the reader's own card placed in each. A device-local concept cart (cap 30 selections, quantity 1-10) with corrupt-storage recovery and cross-tab sync. Ordering is not open and no prices are shown.
- A print pathway on every card surface: "Print this card" on line pages deep-links the quote-card concept, the home line drawer carries the same entry, and finishing a PNG download offers a quiet "want it on paper too?" prompt.
- The paired reading room: a book-and-line carousel led by the daily pick, a dense cloth-spine shelf (20 books home, 24 on the shelf page), header search sharing URL state, and a floating outline-icon rail. Compact mobile shows the full quote, not a miniature card.
- Editorial corpus of ten reader-voice lines per book (1,430 lines, English and Bengali) feeding book pages, the home carousel, and reader feeds.
- Reader-added books: visitors can add books to the live shelf; metadata travels inside their line payloads so shared cards render even offline.

### Changed

- The ownership stamp is restriked: the accession serial prints in coral at weight 600, the Bookplate signature rule doubles in weight, the Ticket cancellation ring is heavier, and quote/name/title sizes step up — applied identically to the DOM card, the 1080×1350 PNG export, and the satori OG preview.
- Noto Serif Bengali is the bilingual display voice with the Manrope/Anek Bangla interface pair; the reading-room theme (butter paper, petrol, persimmon, pistachio) replaced the letterpress look.
- Book covers resolve through Open Library and Internet Archive with labeled cloth fallbacks; book links resolve without API keys.
- Live feeds poll only while the tab is visible, with offline fallbacks: unreachable shelf (502/503 or network failure) still mints a link-only card, and rate limiting stops the stamp with a retry message.
- Line writes batch their Redis commands into one pipeline and the per-IP rate limiter self-heals its expiry window atomically.

### Fixed

- The featured shop CTA links to the gift-set page instead of a removed slug that 404'd.
- Card text renders identically across DOM, PNG, and previews, with measured credit/ownership clearance so maximum-length Bengali never clips on any edition or ink.
- Failed saves say so and recover locally without republishing; drafts survive reloads; broken shop links cannot silently save the example selection.
- Corrupt stored records are dropped instead of crashing feeds; corrupt carts reset with a clean notice.

### Removed

- The unreferenced hero stage and scene components from the earlier storefront.
- The former Fraunces/Plex letterpress fonts and wide-tracked type system.
