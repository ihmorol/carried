# ADR 0002: Free digital cards and local merchandise concepts

Status: accepted for the reading-room migration.

## Context

Carried will monetize physical merchandise customized with a reader's line and Carried branding. Digital cards, all three inks, sharing, and downloads remain free. The requested first implementation is a launch-ready storefront, not live checkout.

## Decision

Add `/shop`, `/shop/[slug]`, and `/shop/cart`. The initial catalog contains proposed art prints, bookmarks, totes, notebooks, and mugs. Product placement diagrams use the canonical `LineCard`, are explicitly labeled concepts, and do not claim real stock, pricing, dimensions, materials, or delivery promises.

The cart stores validated line snapshots, source accession, product slug, placement, and quantity under `carried.cart.v1`. It is device-local with an in-memory fallback. The reading shelf uses its existing key and is not migrated or erased. No account, analytics, payment SDK, customer/address database, order ledger, or fulfillment request is added.

Line/ink/name/book content follows the same artwork contract as the free digital surfaces. Merchandise links are optional and subordinate to sharing and the same-book composer invitation.

## Consequences

Saving a cart selection is not placing an order. Checkout remains unavailable until the merchant supplies a real catalog, prices/currency, print specifications, licensed assets/content, shipping/tax/returns/support rules, and an approved payment/fulfillment integration.

Guest checkout can preserve no accounts, but physical ordering still requires personal-data processing. That future exception needs an explicit decision and documented provider/storage/retention boundaries. A success URL alone must never authorize fulfillment; future payment verification and duplicate-safe order processing need separate implementation.

Publicly available book covers, editorial seed lines, and user submissions are not automatically cleared for commercial reproduction. This ADR grants no license or legal approval.
