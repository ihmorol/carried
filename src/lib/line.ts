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

/**
 * Short, meaningful, unique line ids: the first significant words of the
 * line plus a deterministic 5-char hash of the exact payload.
 *   "Sheep follow. The boy chooses." + name/ink/date → sheep-follow-chooses-k3f2
 * Deterministic, so the same line always maps to the same URL — reposts
 * dedupe naturally — and different lines never share one.
 */
const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "of", "to", "in", "is", "it", "its", "it's",
  "that", "this", "these", "those", "i", "me", "my", "we", "our", "you", "your",
  "he", "she", "his", "her", "him", "they", "them", "their", "was", "were",
  "be", "been", "am", "are", "so", "but", "for", "on", "at", "with", "as",
  "if", "not", "no", "do", "did", "done", "just", "all", "out", "up",
]);

function payloadHash(payload: LinePayload): number {
  const s = JSON.stringify(payload);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

export function lineSlugId(payload: LinePayload, suffixChars = 5): string {
  const words = payload.q
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w && !STOPWORDS.has(w));
  let base = words.slice(0, 4).join("-").slice(0, 28).replace(/-+$/, "");
  // Bangla (and other non-Latin) lines have no latin words — the book's
  // slug keeps the link meaningful instead of a bare "line"
  if (!base) base = payload.b;
  const suffix = payloadHash(payload).toString(36).padStart(suffixChars, "0").slice(0, suffixChars);
  return `${base}-${suffix}`;
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

/** Bengali script detection — used to pick the right typography everywhere. */
export function isBengali(text: string): boolean {
  return /[\u0980-\u09FF]/.test(text);
}

const BN_MONTHS = [
  "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
  "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর",
];
const BN_DIGITS = "০১২৩৪৫৬৭৮৯";

function toBnDigits(s: string): string {
  return s.replace(/\d/g, (d) => BN_DIGITS[Number(d)]);
}

/** Stamp date in Bangla — for cards whose line is written in Bangla. */
export function formatStampDateBn(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${toBnDigits(String(d).padStart(2, "0"))} ${BN_MONTHS[m - 1]} ${toBnDigits(String(y))}`;
}
