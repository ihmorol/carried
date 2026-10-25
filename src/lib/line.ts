import { isInkId, type InkId } from "./inks";
import { LINE_MAX, NAME_MAX } from "./site";

/**
 * A carried line lives entirely inside its URL. The link IS the database:
 * no account, no backend, nothing to store — the share carries the payload,
 * and the OG image is rendered from the same payload server-side.
 *
 * The codec validates structure only. Whether the book exists on the
 * current shelf (curated or reader-added) is checked by the caller via
 * `findBook` — the shelf can grow without invalidating old links.
 */

export type LinePayload = {
  v: 1;
  /** book slug */
  b: string;
  /** the line, 1..220 chars */
  q: string;
  /** the reader's name, 1..24 chars */
  n: string;
  /** card ink */
  s: InkId;
  /** date the line was stamped, YYYY-MM-DD */
  d: string;
};

export class LineError extends Error {}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  const bin = atob(padded);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export function encodeLine(input: {
  bookSlug: string;
  text: string;
  name: string;
  ink: InkId;
  date?: string;
}): { id: string; payload: LinePayload } {
  const text = input.text.trim().replace(/\s+/g, " ");
  const name = input.name.trim().replace(/\s+/g, " ");
  if (!text) throw new LineError("Write the line first.");
  if (text.length > LINE_MAX) throw new LineError(`Lines carry at most ${LINE_MAX} characters.`);
  if (!name) throw new LineError("Sign your name — that's the whole point.");
  if (name.length > NAME_MAX) throw new LineError(`Names are at most ${NAME_MAX} characters.`);
  const payload: LinePayload = {
    v: 1,
    b: input.bookSlug,
    q: text,
    n: name,
    s: input.ink,
    d: input.date ?? new Date().toISOString().slice(0, 10),
  };
  return { id: encodePayload(payload), payload };
}

/** Pure serialization — the store builds payloads for reader-added books itself. */
export function encodePayload(payload: LinePayload): string {
  const json = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);
  return toBase64Url(bytes);
}

export function decodeLine(id: string): LinePayload {
  if (id.length > 1024) throw new LineError("Line too long.");
  let raw: string;
  try {
    raw = new TextDecoder().decode(fromBase64Url(id));
  } catch {
    throw new LineError("This line is written in a hand we can't read.");
  }
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new LineError("This line got smudged in transit.");
  }
  const p = data as Partial<LinePayload>;
  if (p.v !== 1) throw new LineError("This line predates the current ledger.");
  if (typeof p.b !== "string" || !p.b) throw new LineError("The book on this line is not on our shelf.");
  if (typeof p.q !== "string" || !p.q.trim() || p.q.length > LINE_MAX) throw new LineError("This line is out of bounds.");
  if (typeof p.n !== "string" || !p.n.trim() || p.n.length > NAME_MAX) throw new LineError("This line has no readable signature.");
  if (typeof p.s !== "string" || !isInkId(p.s)) throw new LineError("This line uses an unknown ink.");
  if (typeof p.d !== "string" || !DATE_RE.test(p.d)) throw new LineError("This line lost its date.");
  return { v: 1, b: p.b, q: p.q.trim(), n: p.n.trim(), s: p.s, d: p.d };
}

/** FNV-1a over the encoded payload → short accession number, ledger style. */
export function accessionNo(id: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36).toUpperCase().padStart(6, "0").slice(-6);
}

export function formatStampDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  if (!y || !m || !d) return iso;
  return `${String(d).padStart(2, "0")} ${months[m - 1]} ${y}`;
}
