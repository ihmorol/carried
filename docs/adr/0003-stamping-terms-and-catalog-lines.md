# 0003. Stamping terms, catalog lines and seed lines

- Status: accepted
- Date: 2026-11-11

## Context

Products carry real lines from books. Themed boxes and the "collected lines"
catalog need lines Carried is allowed to print, and credits
([0004](0004-reader-credits.md)) need to know who stamped each one.

## Decision

- **Terms at stamping:** the first time someone stamps on a device, they tick a
  checkbox accepting the terms and policies (a link, not the full text). The
  terms let Carried use stamped lines on products. The device remembers the
  tick, so later stamps stay one click.
- **Two kinds of product:**
  - **custom orders:** a reader's own line, printed with their own name
  - **catalog products:** lines picked by the team, sold to anyone, with no
    reader's name; the stamp reads "CARRIED" plus the accession number
- **Day-one themed boxes** use real lines from books picked by the team.
  Readers' stamped lines fill later boxes.
- **Every catalog line records the reader who stamped it first.** Needed for
  credits.
- **Seed lines:** the ~1,100 lines in `lib/seeds/` were AI-generated, not
  written in-house as `CONTEXT.md` said. They are replaced with real lines
  picked by the team before launch.

## Consequences

- The composer gains the terms checkbox and a per-device "accepted" flag.
- The seed coverage test (10 per book) will need revisiting when seeds are
  replaced.
