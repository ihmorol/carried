"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { BOOKS, getBook, originalName, searchBooks, type Book } from "@/lib/books";
import { FrontCover } from "./FrontCover";
import { usePoll } from "@/lib/use-poll";
import { useLocale } from "./LocaleProvider";
import { numFor } from "@/lib/i18n";

const TAGS = ["all", "fiction", "classic", "philosophy", "psychology", "poetry", "fantasy", "scifi", "memoir", "self", "money", "play", "bangla", "reader-added"] as const;
type Tag = typeof TAGS[number];
const DEFAULT_PAGE_SIZE = 24;

type ShelfExplorerProps = {
  variant?: "default" | "workspace";
  pageSize?: number;
  children?: React.ReactNode;
};

export function ShelfExplorer({ variant = "default", pageSize = DEFAULT_PAGE_SIZE, children }: ShelfExplorerProps = {}) {
  const batchSize = Number.isFinite(pageSize) ? Math.max(1, Math.floor(pageSize)) : DEFAULT_PAGE_SIZE;
  const router = useRouter();
  const { t, locale } = useLocale();
  const [userBooks, setUserBooks] = useState<Book[]>([]);
  const [live, setLive] = useState<boolean | null>(null);
  const [connectionError, setConnectionError] = useState(false);
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState<Tag>("all");
  const [shown, setShown] = useState(batchSize);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [year, setYear] = useState("");
  const [bookError, setBookError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [covers, setCovers] = useState<Record<string, string | null>>({});

  useEffect(() => {
    let mounted = true;
    function restore() {
      const params = new URL(window.location.href).searchParams;
      setQuery(params.get("q") ?? "");
      const genre = params.get("genre");
      setTag(TAGS.includes(genre as Tag) ? genre as Tag : "all");
      setShown(batchSize);
    }
    void Promise.resolve().then(() => { if (mounted) restore(); });
    window.addEventListener("popstate", restore);
    return () => { mounted = false; window.removeEventListener("popstate", restore); };
  }, [batchSize]);

  function filter(q: string, genre: Tag) {
    setQuery(q); setTag(genre); setShown(batchSize);
    const url = new URL(window.location.href);
    if (q) url.searchParams.set("q", q); else url.searchParams.delete("q");
    if (genre !== "all") url.searchParams.set("genre", genre); else url.searchParams.delete("genre");
    // Retain Next's history state and the current anchor.
    window.history.replaceState(window.history.state, "", url);
  }

  const refresh = useCallback(async (signal: AbortSignal) => {
    try {
      const res = await fetch("/api/books", { cache: "no-store", signal });
      if (!res.ok) throw new Error("offline");
      const data = await res.json() as { books: Book[]; live: boolean };
      if (signal.aborted) return;
      if (!Array.isArray(data.books)) throw new Error("invalid feed");
      setLive(data.live === true); setConnectionError(false);
      setUserBooks(data.books.filter((book) => book.tags.includes("reader-added")));
    } catch { if (!signal.aborted) { setLive(false); setConnectionError(true); } }
  }, []);
  usePoll(refresh, 15000);
  const all = useMemo(() => [...BOOKS, ...userBooks.filter((book) => !BOOKS.some((b) => b.slug === book.slug))], [userBooks]);
  const results = useMemo(() => {
    const matches = query.trim() ? searchBooks(query, all.length, all) : all;
    return tag === "all" ? matches : matches.filter((book) => book.tags.includes(tag));
  }, [all, query, tag]);

  // Cover-led tiles: resolve covers for the books currently on display.
  // Only curated slugs are askable (reader-added books keep authored covers);
  // later pages merge in, stale responses are ignored and aborted.
  const displayedSlugs = results.slice(0, shown).map((book) => book.slug);
  const coverKey = displayedSlugs.filter((slug) => getBook(slug) !== undefined && covers[slug] === undefined).join(",");
  useEffect(() => {
    if (!coverKey) return;
    const controller = new AbortController();
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/covers?slugs=${encodeURIComponent(coverKey)}`, { cache: "no-store", signal: controller.signal });
        if (!res.ok) return;
        const data = await res.json() as { covers?: Record<string, string | null> };
        if (cancelled || !data.covers || typeof data.covers !== "object") return;
        setCovers((prev) => ({ ...prev, ...data.covers }));
      } catch { /* aborted or offline: tiles keep their authored covers */ }
    })();
    return () => { cancelled = true; controller.abort(); };
  }, [coverKey]);

  async function addBook(e: React.FormEvent) {
    e.preventDefault();
    if (saving || live !== true) return;
    setBookError(null); setSaving(true);
    try {
      const res = await fetch("/api/books", { method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, author, year: year ? Number(year) : undefined }) });
      const data = await res.json() as { book?: Book; error?: string };
      if (!res.ok || !data.book) {
        if (res.status === 503) { setLive(false); setConnectionError(true); }
        setBookError(t(res.status === 429 ? "err.rate" : "err.generic")); return;
      }
      setUserBooks((prev) => [...prev.filter((b) => b.slug !== data.book!.slug), data.book!]);
      router.push(`/b/${data.book.slug}#write`);
    } catch { setLive(false); setConnectionError(true); setBookError(t("shelf.offline.body")); }
    finally { setSaving(false); }
  }

  return <div className={`shelf-explorer shelf-explorer--${variant}`}>
    <div className="shelf-search-row">
      <div className="shelf-search-field">
        <label htmlFor="shelf-search" className="sr-only">{t("shelf.searchLabel")}</label>
        <MagnifyingGlass size={20} weight="regular" aria-hidden="true" />
        <input id="shelf-search" type="search" value={query} onChange={(e) => filter(e.target.value, tag)} placeholder={t("shelf.placeholder")} autoComplete="off" className="field-input" />
      </div>
      <button type="button" onClick={() => setAdding((v) => !v)} aria-expanded={adding} aria-controls="shelf-add-book" className="ui-button-secondary">{adding ? t("shelf.close") : t("shelf.add")}</button>
    </div>
    <div id="shelf-add-book" hidden={!adding}>
    {adding && live === true && <form onSubmit={addBook} className="panel mt-4 p-5">
      <p className="text-sm text-[var(--color-ink-soft)]">{t("shelf.missing")}</p>
      <div className="mt-4 grid items-end gap-3 sm:grid-cols-2">
        <div><label htmlFor="nb-title" className="mb-2 block text-sm">{t("shelf.fTitle")}</label><input id="nb-title" required value={title} onChange={(e) => setTitle(e.target.value)} className="field-input" maxLength={90} /></div>
        <div><label htmlFor="nb-author" className="mb-2 block text-sm">{t("shelf.fAuthor")}</label><input id="nb-author" required value={author} onChange={(e) => setAuthor(e.target.value)} className="field-input" maxLength={60} /></div>
        <div><label htmlFor="nb-year" className="mb-2 block text-sm">{t("shelf.fYear")}</label><input id="nb-year" type="number" min={-3000} max={3000} value={year} onChange={(e) => setYear(e.target.value)} className="field-input" /></div>
        <button type="submit" disabled={saving || live !== true} className="ui-button">{saving ? t("shelf.shelving") : t("shelf.shelve")}</button>
      </div>
      {bookError && <p role="alert" className="mt-3 text-sm text-[var(--color-stamp)]">{bookError}</p>}
    </form>}
    {adding && live !== true && <div className="panel mt-4 p-5" role="status">
      <p className="text-sm font-medium">{t(live === null ? "shelf.connecting" : connectionError ? "shelf.connectionError" : "shelf.offline.title")}</p>
      {live !== null && <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">{t("shelf.offline.body")}</p>}
    </div>}
    </div>
    {children}
    <div className="shelf-filter-bar" role="group" aria-label={t("shelf.filter")}>
      {TAGS.map((id) => <button key={id} type="button" onClick={() => filter(query, id)} aria-pressed={tag === id}>{t(`tag.${id}`)}</button>)}
    </div>
    <p className="shelf-result-count" aria-live="polite">
      {t(results.length === 1 ? "shelf.count.one" : "shelf.count.many", { n: numFor(results.length, locale) })}
      {query.trim() ? t("shelf.for", { q: query.trim() }) : ""}{live === false ? t("shelf.offline") : ""}
    </p>
    {results.length === 0 ? <div className="panel mt-6 p-8 text-center">
      <p className="shelf-empty-title">{t("shelf.empty.title")}</p>
      <button type="button" onClick={() => filter("", "all")} className="ui-button-secondary mt-4">{t("shelf.clear")}</button>
      {query.trim() && <button type="button" onClick={() => { setTitle(query.trim()); setAdding(true); }} className="ui-button-secondary mt-4 ml-2">{t("shelf.empty.cta", { q: query.trim() })}</button>}
    </div> : <>
      <ul className="shelf-book-grid">
        {results.slice(0, shown).map((book) => <li key={book.slug}>
          <a href={`/b/${book.slug}`} className="book-tile">
            <span className="book-tile-art">
              <FrontCover
                slug={book.slug}
                title={originalName(book)}
                author={book.authorBn ?? book.author}
                spine={book.spine}
                src={covers[book.slug] ?? undefined}
              />
            </span>
            <span className="book-tile-title">{originalName(book)}</span>
            <span className="book-tile-author">{book.authorBn ?? book.author}</span>
          </a>
        </li>)}
      </ul>
      {shown < results.length && <div className="shelf-more"><button type="button" onClick={() => setShown((n) => n + batchSize)} className="ui-button-secondary">{t("shelf.more", { n: numFor(Math.min(batchSize, results.length - shown), locale) })}</button></div>}
    </>}
  </div>;
}
