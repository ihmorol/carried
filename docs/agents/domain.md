# Domain docs

Layout: **single-context**. This is one product, one team, one deployable.

- `CONTEXT.md` at the repo root is the domain summary: entities, invariants,
  rendering surfaces, the viral loop. Read it before touching `src/lib/*`.
- Architecture decisions that future readers would otherwise reverse-engineer
  (why the URL is the database, why no cover images) are recorded as short ADRs
  in `docs/adr/` — one file per decision, `NNNN-title.md`, supersede rather than edit.
- Agent rule: if a change contradicts an invariant in `CONTEXT.md`, update the
  doc in the same change or open an ADR explaining why the invariant changed.
