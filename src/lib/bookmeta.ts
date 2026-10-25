import type { Book } from "./books";

/**
 * Free book archives, no API keys anywhere.
 *
 * Two independent sources, tried in order; both may fail and every caller
 * must fall back to the drawn spine and generic search links:
 *  1. Open Library, clean cover scans + the work page (borrow/preview).
 *     Blocked on some networks, usually fine on hosts like Vercel.
 *  2. Internet Archive, item search (most-downloaded edition wins);
 *     its thumbnail is the scanned cover, and the item page holds the
 *     free copy when one exists.
 */

export type BookMeta = {
  coverUrl: string;
  workUrl: string | null;
};

const TIMEOUT_MS = 5000;

// Server-side: prefer IPv4, on hosts with broken IPv6 routes, undici's
// AAAA-first resolution hangs on exactly these archive hosts.
if (typeof window === "undefined") {
  try {
    const dns = await import("node:dns");
    dns.setDefaultResultOrder("ipv4first");
  } catch {
    /* non-node runtime, fetches still work if the network is sane */
  }
}

/** Open Library search: fields=key,cover_i, limit 1. */
async function fromOpenLibrary(book: Book): Promise<BookMeta | null> {
  const params = new URLSearchParams({
    title: book.title,
    author: book.author,
    fields: "key,cover_i",
    limit: "1",
  });
  try {
    const res = await fetch(`https://openlibrary.org/search.json?${params}`, {
      headers: { "user-agent": "carried-site/1.0 (book link resolver)" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      // one lookup per book per week, covers don't churn
      next: { revalidate: 604800 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      docs?: Array<{ key?: string; cover_i?: number }>;
    };
    const doc = data.docs?.[0];
    if (!doc || typeof doc.cover_i !== "number") return null;
    return {
      // default=false → 404 instead of a blank placeholder when no scan exists
      coverUrl: `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg?default=false`,
      workUrl: doc.key ? `https://openlibrary.org${doc.key}` : null,
    };
  } catch {
    return null;
  }
}

function quote(s: string): string {
  return `"${s.replace(/"/g, "")}"`;
}

/** Internet Archive: most-downloaded text item matching title + author surname. */
async function fromArchive(book: Book): Promise<BookMeta | null> {
  const surname = book.author.trim().split(/\s+/).pop() ?? book.author;
  const q = `title:(${quote(book.title)}) AND creator:(${quote(surname)}) AND mediatype:texts`;
  const params = new URLSearchParams({
    q,
    rows: "1",
    page: "1",
    output: "json",
  });
  params.append("fl[]", "identifier");
  params.append("sort[]", "downloads desc");
  try {
    const res = await fetch(`https://archive.org/advancedsearch.php?${params}`, {
      headers: { "user-agent": "carried-site/1.0 (book link resolver)" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      next: { revalidate: 604800 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      response?: { docs?: Array<{ identifier?: string }> };
    };
    const id = data.response?.docs?.[0]?.identifier;
    if (!id || !/^[A-Za-z0-9._-]+$/.test(id)) return null;
    return {
      coverUrl: `https://archive.org/services/img/${id}`,
      workUrl: `https://archive.org/details/${id}`,
    };
  } catch {
    return null;
  }
}

export async function fetchBookMeta(book: Book): Promise<BookMeta | null> {
  return (await fromOpenLibrary(book)) ?? (await fromArchive(book));
}

/** Archive links that never depend on an API: search pages on free shelves. */
export function bookArchiveLinks(book: Book): Array<{ label: string; hint: string; href: string }> {
  const q = encodeURIComponent(`${book.title} ${book.author}`);
  return [
    {
      label: "Internet Archive",
      hint: "free copies & audio",
      href: `https://archive.org/search?query=${q}`,
    },
    {
      label: "Bookshop.org",
      hint: "buy, supports indies",
      href: `https://bookshop.org/search?keywords=${q}`,
    },
    {
      label: "WorldCat",
      hint: "find it near you",
      href: `https://search.worldcat.org/search?q=${q}`,
    },
  ];
}
