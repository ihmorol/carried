import { encodeLine, lineSlugId, type LinePayload } from "../line";
import type { Seed } from "./seed-type";
import { CANON_1 } from "./canon-1";
import { CANON_2 } from "./canon-2";
import { MODERN_1 } from "./modern-1";
import { MORE } from "./more";
import { IDEAS } from "./ideas";
import { BANGLA_1 } from "./bangla-1";
import { BANGLA_2 } from "./bangla-2";

/** All editorial seed lines across the shelf. */
export const SEEDS: Seed[] = [
  ...CANON_1,
  ...CANON_2,
  ...MODERN_1,
  ...MORE,
  ...IDEAS,
  ...BANGLA_1,
  ...BANGLA_2,
];

/** A few hand-written dates roll over the month; normalize deterministically. */
function normalizeDate(d: string): string {
  const [y, m, day] = d.split("-").map(Number);
  if (!y || !m || !day) return d;
  const dt = new Date(Date.UTC(y, m - 1, 1));
  dt.setUTCDate(day);
  return dt.toISOString().slice(0, 10);
}

export type SeedLine = LinePayload & { id: string };

export const SEED_LINES: SeedLine[] = SEEDS.map((s) => {
  const { payload } = encodeLine({
    bookSlug: s.b,
    text: s.q,
    name: s.n,
    ink: s.s,
    date: normalizeDate(s.d),
  });
  return { ...payload, id: lineSlugId(payload) };
});

/** slug id → seed, so short seed links resolve with zero storage. */
export const SEED_LINE_BY_ID: ReadonlyMap<string, SeedLine> = new Map(
  SEED_LINES.map((l) => [l.id, l]),
);

export function seedLinesFor(slug: string): SeedLine[] {
  return SEED_LINES.filter((l) => l.b === slug);
}

/** The home ticker — a stable rotation, capped so the marquee stays light. */
export function marqueeLines(): SeedLine[] {
  const picked: SeedLine[] = [];
  const seen = new Set<string>();
  for (let i = 0; picked.length < 40 && i < SEED_LINES.length; i++) {
    const l = SEED_LINES[i];
    if (!seen.has(l.b)) {
      seen.add(l.b);
      picked.push(l);
    }
  }
  return picked;
}

/** Deterministic pick that changes daily — the home page's front card. */
export function lineOfTheDay(): SeedLine {
  const day = Math.floor(Date.now() / 86_400_000);
  return SEED_LINES[day % SEED_LINES.length];
}
