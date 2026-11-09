# ADR 0001: A line's payload carries its reader-added book

Date: 2026-11-08 · Status: accepted

## Context

Shared card links 404'd in production. The site runs on stateless
serverless functions, and without Redis connected every instance holds a
private, throwaway `MemoryStore`. A reader-added book and its line were
written into one instance's memory; the next render (the card page, the
book page) landed elsewhere and `findBook` missed, so `notFound()` fired.
The composer's URL-carried fallback existed but only ran when the POST
failed outright, which never happens on serverless: a MemoryStore answers
201 just fine.

The curated shelf never had this problem: `getBook` is static, and lines
for curated books already resolve from the URL alone. Only reader-added
books needed a server that remembered them.

## Decision

The link stays the database. A `LinePayload` may carry optional book
metadata, `bt` (title), `ba` (author), `by` (year), always as a unit,
written only when the book is not on the curated shelf. Concretely:

- The store stamps the meta onto every stored line of a reader-added
  book (`addLine`), so feeds and stored ids render statelessly too.
- The composer, when the store is not live (`live: false` in the POST
  response), skips the store id entirely and carries the whole payload
  in the URL (base64), meta included.
- `bookForPayload` (in `lib/books.ts`) resolves a line's book: curated
  shelf first, then the URL's meta, then nothing. Every card surface
  (LineCard, canvas export, satori OG, line page, share text) resolves
  through it, so all three rendering surfaces stay identical.
- The line page's viral-loop CTA falls back to `/#shelf` when the book
  page itself cannot exist server-side.
- Offline, the shelf's add-book form is replaced by an honest note;
  adding books needs the live shelf.

`v` stays 1: the fields are optional and additive, old links keep
decoding. The vote route's id ceiling was raised from 512 to 1024 to
match `decodeLine` and make room for the longer ids.

## Consequences

- Any card URL renders on any stateless server, forever, no Redis
  required.
- Connecting Upstash later remains the path to globally shared
  reader-added books, feeds, and votes; nothing above changes.
- URLs for reader-added lines grow by roughly a hundred characters,
  well under the 1024 ceiling.
- Malformed meta (partial unit, bad caps) is a structural error and
  404s like any other unreadable line.
