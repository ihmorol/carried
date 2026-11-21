# Card editions and bookshelf design preview

This is the visual approval checkpoint for the collectible-card redesign. It does not modify production cards, payloads, shelves, carts, or sharing.

## Open the board

```bash
CARRIED_DESIGN_PREVIEW=1 npm run dev -- --port 3045
```

Visit `http://localhost:3045/design-preview`.

The route returns 404 unless `CARRIED_DESIGN_PREVIEW=1` is set. It is also marked noindex. The preview uses a separate `.next-design-preview` directory so it does not replace the existing application's build/cache.

## What can be reviewed

- Bookplate, Poster, and Reader's ticket compositions with distinct ownership marks.
- The same English or Bangla line across all three editions.
- Short/long examples, three inks, editable line/name, and an optional stamp replay.
- A cover-led bookshelf with local search and category filtering.
- The selected edition beside the bookshelf, inside the existing two-sector arrangement.

Four real book-cover images were verified by edition and visible title/author. Their source record is `public/design-preview/covers/SOURCES.md`. The two original typographic cover studies are labeled preview covers. These images are not approved for merchandise reproduction.

## Review boundary

Do not connect these prototypes to the payload codec, API, or saved cards until the user reviews the board. Production integration needs versioned template IDs, legacy compatibility tests, renderer parity, and the approved cover lookup rules. Passing preview tests is not approval of the artwork.
