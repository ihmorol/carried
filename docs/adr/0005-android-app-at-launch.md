# 0005. Android app at launch, built with React Native

- Status: accepted
- Date: 2026-11-11

## Context

Most phones in Bangladesh run Android, and a wallpaper that changes daily is a
reason to keep an app. The website is TypeScript.

## Decision

- **React Native (Expo)**, so the app reuses the website's TypeScript: the line
  codec, validation, card styles and search. Small native modules cover what
  JavaScript can't (setting the wallpaper; iPhone widgets later).
- **Android ships on 1 January 2027 with everything the website has,
  including checkout.** Physical goods may use our own payment gateway in-app;
  Google Play billing only applies to digital goods, and every digital design is
  free.
- **Wallpapers:**
  - Android: the app sets the wallpaper and can rotate a reader's lines daily.
  - iPhone (later): Apple lets no app set the wallpaper, so save to Photos, a
    one-tap Shortcut, and a "line of the day" widget.
  - Desktop: downloads from the website in 16:9, 16:10 and ultrawide.
  - No watermark; the "CARRIED BY" stamp is the branding.
- **Google Play:** published under an organization account (needs a D-U-N-S
  number, applied for now). Personal accounts must first run a 14-day closed
  test with 12+ testers.
- iOS comes after launch.

## Consequences

- Shared logic should live where both the Next.js site and the app can import it.
- Biggest launch risk: website checkout and a full Android app with checkout in
  about seven weeks. If the date slips, in-app checkout can hand off to the
  website's checkout first.
