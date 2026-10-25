import { BOOKS, getBook, SPINE_COLORS, type Book, type SpineColor } from "./books";
import { encodePayload, type LinePayload } from "./line";
import { SEED_LINES } from "./seeds";
import { isInkId, type InkId } from "./inks";
import { LINE_MAX, NAME_MAX } from "./site";

/**
 * The live shelf: every line, every reader-added book, visible to everyone.
 *
 * Two backends behind one interface:
 *  - RedisStore — Upstash Redis REST (free tier, two env vars). Real, global,
 *    shared. This is what production runs on.
 *  - MemoryStore — per-instance, preseeded with the editorial lines. Dev/demo
 *    fallback so the site still works with zero configuration.
 *
 * A LineRecord pairs a payload with its URL id (the same id the /l/[id]
 * stateless card page uses) and a timestamp, so feeds can sort and merge.
 */

export type LineRecord = { id: string; payload: LinePayload; t: number };

export interface Store {
  readonly kind: "redis" | "memory";
  getLines(slug: string, limit?: number): Promise<LineRecord[]>;
  countLines(slug: string): Promise<number>;
  addLine(slug: string, input: { q: string; n: string; s: InkId }): Promise<LineRecord>;
  addBook(input: { title: string; author: string; year?: number }): Promise<Book>;
  getUserBooks(): Promise<Book[]>;
  getUserBook(slug: string): Promise<Book | undefined>;
  getRecent(limit: number): Promise<LineRecord[]>;
}

export class StoreError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
  }
}

/* ── shared validation (server side mirror of encodeLine's rules) ── */

export function validateLineInput(input: { q: string; n: string; s: InkId }): { q: string; n: string } {
  const q = String(input?.q ?? "").trim().replace(/\s+/g, " ");
  const n = String(input?.n ?? "").trim().replace(/\s+/g, " ");
  if (!q) throw new StoreError("Write the line first.", 400);
  if (q.length > LINE_MAX) throw new StoreError(`Lines carry at most ${LINE_MAX} characters.`, 400);
  if (!n) throw new StoreError("Sign your name.", 400);
  if (n.length > NAME_MAX) throw new StoreError(`Names are at most ${NAME_MAX} characters.`, 400);
  return { q, n };
}

export function validateBookInput(input: { title: string; author: string; year?: number }): {
  title: string;
  author: string;
  year: number;
} {
  const title = String(input?.title ?? "").trim().replace(/\s+/g, " ");
  const author = String(input?.author ?? "").trim().replace(/\s+/g, " ");
  if (!title || title.length > 90) throw new StoreError("A title is needed (max 90 characters).", 400);
  if (!author || author.length > 60) throw new StoreError("An author is needed (max 60 characters).", 400);
  let year = Number(input?.year);
  if (!Number.isFinite(year) || year === 0) year = new Date().getFullYear();
  year = Math.trunc(year);
  if (year < -3000 || year > new Date().getFullYear()) throw new StoreError("That year reads wrong.", 400);
  return { title, author, year };
}

export function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
    .replace(/-+$/g, "");
}

function spineFor(slug: string): SpineColor {
  const keys = Object.keys(SPINE_COLORS) as SpineColor[];
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 33 + slug.charCodeAt(i)) >>> 0;
  return keys[h % keys.length];
}

/* ── Upstash Redis REST ── */

class RedisStore implements Store {
  readonly kind = "redis" as const;
  constructor(private url: string, private token: string) {}

  private async cmd<T = unknown>(...args: (string | number)[]): Promise<T> {
    const path = args.map((a) => encodeURIComponent(String(a))).join("/");
    const res = await fetch(`${this.url}/${path}`, {
      headers: { Authorization: `Bearer ${this.token}` },
      cache: "no-store",
    });
    if (!res.ok) throw new StoreError("The live shelf is unreachable.", 502);
    const json = (await res.json()) as { result?: T; error?: string };
    if (json.error) throw new StoreError(`Shelf error: ${json.error}`, 502);
    return json.result as T;
  }

  async limit(kind: "line" | "book", ip: string, max: number): Promise<void> {
    const key = `carried:rl:${kind}:${ip}`;
    const n = await this.cmd<number>(...["INCR", key]);
    if (n === 1) await this.cmd("EXPIRE", key, 3600);
    if (n > max) throw new StoreError("Easy — the shelf will still be here in an hour.", 429);
  }

  async getLines(slug: string, limit = 200): Promise<LineRecord[]> {
    const raw = await this.cmd<string[]>("LRANGE", `carried:lines:${slug}`, "0", String(limit - 1));
    return parseRecords(raw);
  }

  async countLines(slug: string): Promise<number> {
    return this.cmd<number>("LLEN", `carried:lines:${slug}`);
  }

  async addLine(slug: string, input: { q: string; n: string; s: InkId }): Promise<LineRecord> {
    const book = (await this.getUserBook(slug)) ?? getBook(slug);
    if (!book) throw new StoreError("That book is not on the shelf.", 404);
    const { q, n } = validateLineInput(input);
    if (!isInkId(input.s)) throw new StoreError("Unknown ink.", 400);

    // idempotent-ish: return the existing record for an exact repeat
    const existing = await this.getLines(slug, 20);
    const dup = existing.find(
      (r) => r.payload.q.toLowerCase() === q.toLowerCase() && r.payload.n.toLowerCase() === n.toLowerCase(),
    );
    if (dup) return dup;

    const payload: LinePayload = {
      v: 1,
      b: slug,
      q,
      n,
      s: input.s,
      d: new Date().toISOString().slice(0, 10),
    };
    const record: LineRecord = { id: encodePayload(payload), payload, t: Date.now() };
    const body = JSON.stringify(record);
    await this.cmd("LPUSH", `carried:lines:${slug}`, body);
    await this.cmd("LTRIM", `carried:lines:${slug}`, "0", "499");
    await this.cmd("LPUSH", "carried:recent", body);
    await this.cmd("LTRIM", "carried:recent", "0", "199");
    return record;
  }

  async addBook(input: { title: string; author: string; year?: number }): Promise<Book> {
    const { title, author, year } = validateBookInput(input);
    let slug = slugifyTitle(title) || "untitled";
    if (getBook(slug) || (await this.getUserBook(slug))) {
      const authorWord = slugifyTitle(author.split(" ")[0] ?? "");
      slug = authorWord && !slug.includes(authorWord) ? `${slug}-${authorWord}` : `${slug}-2`;
      if (getBook(slug) || (await this.getUserBook(slug))) throw new StoreError("That book is already on the shelf.", 409);
    }
    const book: Book = { slug, title, author, year, tags: ["reader-added"], spine: spineFor(slug) };
    await this.cmd("HSET", "carried:books:user", slug, JSON.stringify(book));
    return book;
  }

  async getUserBooks(): Promise<Book[]> {
    const raw = await this.cmd<Record<string, string> | null>("HGETALL", "carried:books:user");
    if (!raw) return [];
    return Object.values(raw)
      .map((v) => safeParse<Book>(v))
      .filter((b): b is Book => !!b);
  }

  async getUserBook(slug: string): Promise<Book | undefined> {
    const raw = await this.cmd<string | null>("HGET", "carried:books:user", slug);
    return raw ? safeParse<Book>(raw) ?? undefined : undefined;
  }

  async getRecent(limit: number): Promise<LineRecord[]> {
    const raw = await this.cmd<string[]>("LRANGE", "carried:recent", "0", String(limit - 1));
    return parseRecords(raw);
  }
}

/* ── in-memory fallback (dev / zero-config demo) ── */

class MemoryStore implements Store {
  readonly kind = "memory" as const;
  private lines = new Map<string, LineRecord[]>();
  private recent: LineRecord[] = [];
  private books = new Map<string, Book>();

  constructor() {
    for (const seed of SEED_LINES) {
      const rec: LineRecord = { id: seed.id, payload: seed, t: new Date(`${seed.d}T12:00:00Z`).getTime() };
      this.push(`carried:lines:${seed.b}`, rec);
      this.recent.push(rec);
    }
    this.recent.reverse();
  }

  private push(key: string, rec: LineRecord) {
    const list = this.lines.get(key) ?? [];
    list.unshift(rec);
    this.lines.set(key, list.slice(0, 500));
  }

  async getLines(slug: string, limit = 200): Promise<LineRecord[]> {
    return [...(this.lines.get(`carried:lines:${slug}`) ?? [])].slice(0, limit);
  }

  async countLines(slug: string): Promise<number> {
    return (this.lines.get(`carried:lines:${slug}`) ?? []).length;
  }

  async addLine(slug: string, input: { q: string; n: string; s: InkId }): Promise<LineRecord> {
    if (!isInkId(input.s)) throw new StoreError("Unknown ink.", 400);
    const { q, n } = validateLineInput(input);
    const payload: LinePayload = {
      v: 1,
      b: slug,
      q,
      n,
      s: input.s,
      d: new Date().toISOString().slice(0, 10),
    };
    const id = encodePayload(payload);
    const dup = (this.lines.get(`carried:lines:${slug}`) ?? []).find((r) => r.id === id);
    if (dup) return dup;
    const record: LineRecord = { id, payload, t: Date.now() };
    this.push(`carried:lines:${slug}`, record);
    this.recent.unshift(record);
    this.recent = this.recent.slice(0, 200);
    return record;
  }

  async addBook(input: { title: string; author: string; year?: number }): Promise<Book> {
    const { title, author, year } = validateBookInput(input);
    let slug = slugifyTitle(title) || "untitled";
    if (getBook(slug) || this.books.has(slug)) slug = `${slug}-2`;
    if (getBook(slug) || this.books.has(slug)) throw new StoreError("That book is already on the shelf.", 409);
    const book: Book = { slug, title, author, year, tags: ["reader-added"], spine: spineFor(slug) };
    this.books.set(slug, book);
    return book;
  }

  async getUserBooks(): Promise<Book[]> {
    return [...this.books.values()];
  }

  async getUserBook(slug: string): Promise<Book | undefined> {
    return this.books.get(slug);
  }

  async getRecent(limit: number): Promise<LineRecord[]> {
    return this.recent.slice(0, limit);
  }
}

/* ── singleton ── */

function parseRecords(raw: string[]): LineRecord[] {
  return raw
    .map((v) => safeParse<LineRecord>(v))
    .filter((r): r is LineRecord => !!r?.id && !!r.payload);
}

function safeParse<T>(v: string): T | null {
  try {
    return JSON.parse(v) as T;
  } catch {
    return null;
  }
}

const g = globalThis as typeof globalThis & { __carriedStore?: Store };

export function getStore(): Store {
  if (g.__carriedStore) return g.__carriedStore;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  g.__carriedStore = url && token ? new RedisStore(url, token) : new MemoryStore();
  return g.__carriedStore;
}

export function storeIsLive(): boolean {
  return getStore().kind === "redis";
}

/** The curated shelf plus everything readers added. */
export async function allBooks(): Promise<Book[]> {
  const userBooks = await getStore().getUserBooks();
  const known = new Set(BOOKS.map((b) => b.slug));
  return [...BOOKS, ...userBooks.filter((b) => !known.has(b.slug))];
}

export async function findBook(slug: string): Promise<Book | undefined> {
  return getBook(slug) ?? (await getStore().getUserBook(slug));
}

/** Basic per-IP limiter for the API routes. */
export async function checkRate(kind: "line" | "book", ip: string, limit: number): Promise<void> {
  const store = getStore();
  if (store instanceof RedisStore) {
    await store.limit(kind, ip, limit);
    return;
  }
  // dev: no limiting needed
}
