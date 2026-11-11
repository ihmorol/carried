# 0004. Reader credits

- Status: accepted
- Date: 2026-11-11

## Context

Readers whose lines sell should get something back, without paying royalties
yet and without a scheme that fake devices can farm.

## Decision

- **Earning:** 10 credits for each item sold with your line on it. Only paid
  orders count; saves, re-stamps and shares earn nothing.
- **Who earns:** only lines stamped while signed in. If several readers stamped
  the same line, the first to stamp it earns.
- **Spending:** 1,000 credits = 100 taka off. A discount can't exceed a set
  share of the product total (about 20%, delivery excluded) and never more than
  200 taka per order. Credits are spent at checkout while signed in.
- Ships at launch, 1 January 2027.
- No royalties for now; they may come later.

## Consequences

- Orders record the catalog line (and so the earning reader) for each item.
- The percentage cap keeps the 60–70% margin
  ([0001](0001-sell-physical-products-in-bangladesh.md)) on small orders.
- Open, not needed for launch: whether credits expire.
