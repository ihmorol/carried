/**
 * Deterministic jitter so cards and spines read as objects laid down by
 * hand, not stamped out by a machine. Same input, same angle, every
 * render, on server and client.
 *
 * The polynomial sum alone lands sequential ids in neighbouring buckets
 * (line-0, line-1, ... count up together), so the result is run through
 * a final integer avalanche before use.
 */
export function hashStr(s: string): number {
  let h = 7;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 100003;
  h = Math.imul(h ^ (h >>> 15), 2246822519);
  h = Math.imul(h ^ (h >>> 13), 3266489917);
  h ^= h >>> 16;
  return h >>> 0;
}

/** Rotation in degrees within ±spread/2, derived from the id. */
export function tiltFor(id: string, spread = 3.4): number {
  const t = ((hashStr(id) % 1000) / 1000) * spread - spread / 2;
  return Math.round(t * 10) / 10;
}

/** The shelf is seen a hair off square; each book sits at its own angle. */
export function ryFor(slug: string): number {
  return -(10 + (hashStr(slug) % 6));
}

/** One shelf in eight holds a leaning book. */
export function leanFor(slug: string): number {
  return hashStr(slug) % 8 === 0 ? -4 : 0;
}
