# 0002. Optional accounts and server-side reader data

- Status: accepted. Supersedes the "no accounts, no server-side user data"
  invariant in `CONTEXT.md` and `AGENTS.md`.
- Date: 2026-11-11

## Context

Orders need a name, phone, address and payment. Credits
([0004](0004-reader-credits.md)) need to know who stamped a line. Neither fits a
site that keeps nothing on the server.

## Decision

- **Guests stay guests.** Writing, stamping and sharing never require an account.
- **Accounts are optional** and passwordless: a one-time code by SMS or email.
  They are offered in two places only:
  - at checkout, where an account is required
  - next to the stamp button, as "Sign in to earn credits on this line"
- **Promotions** go only to people who ticked "Send me offers" at checkout
  (unticked by default, for everyone) or turned on app notifications.
- **Reader ID:** guests are recognised by the existing anonymous device ID, not
  by IP. Signing in merges the device's reader ID and saved lines into the
  account, so lines sync between the website and the app. IP stays a
  rate-limit layer only.
- **No fingerprinting.** Browser/device-trait or IP matching is ruled out: app
  stores forbid it, browsers block it, and shared carrier IPs in Bangladesh make
  it wrong.
- **Storage:** a managed Postgres database for accounts, reader IDs, orders,
  catalog lines and credits. Redis stays for live feeds and votes. Login codes
  go through a Bangladeshi SMS provider.
- **Apps:** an app that creates accounts must let people delete them in-app.

## Consequences

- `AGENTS.md` non-negotiable #1, the `CONTEXT.md` invariant and the brand
  guide's "don't require an account" rule are rewritten to match.
- Open: which extra cross-device links ship (passkeys on the web, iCloud
  key-value / Android Block Store in the app, a link-a-device QR code). Sign-in
  covers syncing at launch.
