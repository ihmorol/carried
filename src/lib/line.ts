import { isInkId, type InkId } from "./inks";
import { isCardTemplateId, type CardTemplateId } from "./card-templates";
import { LINE_MAX, NAME_MAX } from "./site";

/**
 * A carried line lives entirely inside its URL. The link IS the database:
 * no account, no backend, nothing to store, the share carries the payload,
 * and the OG image is rendered from the same payload server-side.
 *
 * The codec validates structure only. Whether the book exists on the
 * current shelf (curated or reader-added) is checked by the caller via
 * `findBook`, the shelf can grow without invalidating old links.
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
  /**
   * Optional book metadata, present only when the book is NOT on the
   * curated shelf (reader-added). Carried in the URL so the card renders
   * with zero server state, the shelf can stay stateless. Always written
   * as a unit: all three or none.
   */
  bt?: string;
  ba?: string;
  by?: number;
  /**
   * Optional card edition. Absent means the line predates editions: its
   * serialization and identity stay exactly as minted, so this field is
   * never backfilled. New cards write an explicit immutable id after the
   * book metadata.
   */
  ct?: CardTemplateId;
};

export class LineError extends Error {}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const LINE_ID_MAX = 4096;
export const BOOK_SLUG_MAX = 128;

function validDate(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/** Caps mirror validateBookInput; kept here so the codec stays standalone. */
export const BOOK_TITLE_MAX = 90;
export const BOOK_AUTHOR_MAX = 60;
const BOOK_YEAR_MIN = -3000;
const BOOK_YEAR_MAX = 3000;

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
  /** book meta, carried in the URL for books the curated shelf doesn't know */
  book?: { title: string; author: string; year: number };
  /** card edition; omitted keeps the payload in its legacy shape */
  template?: CardTemplateId;
}): { id: string; payload: LinePayload } {
  if (typeof input.text !== "string" || typeof input.name !== "string") throw new LineError("This line is out of bounds.");
  if (typeof input.bookSlug !== "string" || !input.bookSlug || input.bookSlug.length > BOOK_SLUG_MAX || !/^[a-z0-9-]+$/.test(input.bookSlug)) throw new LineError("The book on this line is not on our shelf.");
  if (!isInkId(input.ink)) throw new LineError("This line uses an unknown ink.");
  const date = input.date ?? new Date().toISOString().slice(0, 10);
  if (!validDate(date)) throw new LineError("This line lost its date.");
  const text = input.text.trim().replace(/\s+/g, " ");
  const name = input.name.trim().replace(/\s+/g, " ");
  if (!text) throw new LineError("Write the line first.");
  if (text.length > LINE_MAX) throw new LineError(`Lines carry at most ${LINE_MAX} characters.`);
  if (!name) throw new LineError("Sign your name, that's the whole point.");
  if (name.length > NAME_MAX) throw new LineError(`Names are at most ${NAME_MAX} characters.`);
  const payload: LinePayload = {
    v: 1,
    b: input.bookSlug,
    q: text,
    n: name,
    s: input.ink,
    d: date,
  };
  if (input.book) {
    const bt = input.book.title.trim().replace(/\s+/g, " ");
    const ba = input.book.author.trim().replace(/\s+/g, " ");
    if (!bt || bt.length > BOOK_TITLE_MAX) throw new LineError("That book title reads wrong.");
    if (!ba || ba.length > BOOK_AUTHOR_MAX) throw new LineError("That book author reads wrong.");
    const by = Math.trunc(input.book.year);
    if (!Number.isFinite(by) || by < BOOK_YEAR_MIN || by > BOOK_YEAR_MAX) {
      throw new LineError("That book year reads wrong.");
    }
    payload.bt = bt;
    payload.ba = ba;
    payload.by = by;
  }
  if (input.template !== undefined) {
    if (!isCardTemplateId(input.template)) throw new LineError("That card design is unknown.");
    payload.ct = input.template;
  }
  const id = encodePayload(payload);
  if (id.length > LINE_ID_MAX) throw new LineError("Line too long.");
  return { id, payload };
}

/** Pure serialization, the store builds payloads for reader-added books itself. */
export function encodePayload(payload: LinePayload): string {
  const json = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);
  return toBase64Url(bytes);
}

/**
 * Short, meaningful, unique line ids: the first significant words of the
 * line plus a deterministic 5-char hash of the exact payload.
 *   "Sheep follow. The boy chooses." + name/ink/date → sheep-follow-chooses-k3f2
 * Deterministic, so the same line always maps to the same URL, reposts
 * dedupe naturally, and different lines never share one.
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
  // Bangla (and other non-Latin) lines have no latin words, the book's
  // slug keeps the link meaningful instead of a bare "line"
  if (!base) base = payload.b.slice(0, 48).replace(/-+$/, "");
  const width = Math.max(5, Math.min(suffixChars, 10));
  const suffix = payloadHash(payload).toString(36).padStart(width, "0").slice(0, width);
  return `${base.slice(0, 63 - width)}-${suffix}`;
}

export function decodeLine(id: string): LinePayload {
  if (typeof id !== "string" || id.length > LINE_ID_MAX) throw new LineError("Line too long.");
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
  return validateLinePayload(data);
}

/** Every URL, saved entry, and cart carries the same validated structure. */
export function validateLinePayload(data: unknown): LinePayload {
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new LineError("This line got smudged in transit.");
  const p = data as Partial<LinePayload>;
  if (p.v !== 1) throw new LineError("This line predates the current ledger.");
  if (typeof p.b !== "string" || !p.b || p.b.length > BOOK_SLUG_MAX || !/^[a-z0-9-]+$/.test(p.b)) throw new LineError("The book on this line is not on our shelf.");
  if (typeof p.q !== "string" || !p.q.trim() || p.q.length > LINE_MAX) throw new LineError("This line is out of bounds.");
  if (typeof p.n !== "string" || !p.n.trim() || p.n.length > NAME_MAX) throw new LineError("This line has no readable signature.");
  if (typeof p.s !== "string" || !isInkId(p.s)) throw new LineError("This line uses an unknown ink.");
  if (typeof p.d !== "string" || !validDate(p.d)) throw new LineError("This line lost its date.");
  const out: LinePayload = { v: 1, b: p.b, q: p.q.trim(), n: p.n.trim(), s: p.s, d: p.d };
  // book meta is a unit: all three fields or none, each within its cap
  const hasMeta = p.bt !== undefined || p.ba !== undefined || p.by !== undefined;
  if (hasMeta) {
    if (typeof p.bt !== "string" || !p.bt.trim() || p.bt.length > BOOK_TITLE_MAX) {
      throw new LineError("The book on this line is smudged.");
    }
    if (typeof p.ba !== "string" || !p.ba.trim() || p.ba.length > BOOK_AUTHOR_MAX) {
      throw new LineError("The book on this line is smudged.");
    }
    if (typeof p.by !== "number" || !Number.isInteger(p.by) || p.by < BOOK_YEAR_MIN || p.by > BOOK_YEAR_MAX) {
      throw new LineError("The book on this line is smudged.");
    }
    out.bt = p.bt.trim();
    out.ba = p.ba.trim();
    out.by = p.by;
  }
  if (p.ct !== undefined) {
    if (!isCardTemplateId(p.ct)) throw new LineError("This line uses an unknown card design.");
    out.ct = p.ct;
  }
  return out;
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

/** Bengali script detection, used to pick the right typography everywhere. */
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

/** Stamp date in Bangla, for cards whose line is written in Bangla. */
export function formatStampDateBn(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${toBnDigits(String(d).padStart(2, "0"))} ${BN_MONTHS[m - 1]} ${toBnDigits(String(y))}`;
}
