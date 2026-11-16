"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { BOOKS, originalName, searchBooks, type Book } from "@/lib/books";
import { isBengali } from "@/lib/line";
import { BookSpine } from "./BookSpine";
import { usePoll } from "@/lib/use-poll";
import { useLocale } from "./LocaleProvider";
import { numFor } from "@/lib/i18n";

const TAGS = ["all", "fiction", "classic", "philosophy", "psychology", "poetry", "fantasy", "scifi", "memoir", "self", "money", "play", "bangla", "reader-added"] as const;
type Tag = typeof TAGS[number];
const DEFAULT_PAGE_SIZE = 24;

type ShelfExplorerProps = {
  variant?: "default" | "workspace";
  pageSize?: number;
  searchPlacement?: "inline" | "header";
  children?: React.ReactNode;
};

export function ShelfExplorer({ variant = "default", pageSize = DEFAULT_PAGE_SIZE, searchPlacement = "inline", children }: ShelfExplorerProps = {}) {
  const batchSize = Number.isFinite(pageSize) ? Math.max(1, Math.floor(pageSize)) : DEFAULT_PAGE_SIZE;
  const router = useRouter();
  const { t, locale } = useLocale();
  const [userBooks, setUserBooks] = useState<Book[]>([]);
  const [live, setLive] = useState<boolean | null>(null);
  const [connectionError, setConnectionError] = useState(false);
  const [{ query, tag, shown }, setView] = useState({ query: "", tag: "all" as Tag, shown: batchSize, batch: batchSize });
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [year, setYear] = useState("");
  const [bookError, setBookError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // Keep filter changes and pagination in one update. Repeated notifications
  // (including our own carried:search event) must not collapse a longer shelf.
  const restoreFilters = useCallback((query: string, tag: Tag) => {
    setView((current) => current.query === query && current.tag === tag && current.batch === batchSize
      ? current
      : { query, tag, shown: batchSize, batch: batchSize });
  }, [batchSize]);

  useEffect(() => {
    let mounted = true;
    function restore() {
      const params = new URL(window.location.href).searchParams;
      const genre = params.get("genre");
      restoreFilters(params.get("q") ?? "", TAGS.includes(genre as Tag) ? genre as Tag : "all");
    }
    void Promise.resolve().then(() => { if (mounted) restore(); });
    window.addEventListener("popstate", restore);
    window.addEventListener("carried:search", restore);
    return () => {
      mounted = false;
      window.removeEventListener("popstate", restore);
      window.removeEventListener("carried:search", restore);
    };
  }, [restoreFilters]);

  function filter(q: string, genre: Tag) {
    restoreFilters(q, genre);
    const url = new URL(window.location.href);
    if (q) url.searchParams.set("q", q); else url.searchParams.delete("q");
    if (genre !== "all") url.searchParams.set("genre", genre); else url.searchParams.delete("genre");
    // Retain Next's history state and the current anchor; notify the shared header.
    window.history.replaceState(window.history.state, "", url);
    window.dispatchEvent(new Event("carried:search"));
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

  return <div className={`shelf-explorer shelf-explorer--${variant}`} data-search-placement={searchPlacement}>
    <div className="shelf-search-row">
      {searchPlacement === "inline" && <div className="shelf-search-field">
        <label htmlFor="shelf-search" className="sr-only">{t("shelf.searchLabel")}</label>
        <MagnifyingGlass size={20} weight="regular" aria-hidden="true" />
        <input id="shelf-search" type="search" value={query} onChange={(e) => filter(e.target.value, tag)} placeholder={t("shelf.placeholder")} autoComplete="off" className="field-input" />
      </div>}
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
      <ul className="shelf-book-grid shelf-spine-grid">
        {results.slice(0, shown).map((book) => {
          const name = originalName(book);
          const author = book.authorBn ?? book.author;
          const year = book.year < 0 ? `${Math.abs(book.year)} BC` : String(book.year);
          return <li key={book.slug}>
            <a href={`/b/${book.slug}`} className="shelf-spine-link" aria-label={`${name} — ${author}, ${year}`}>
              <span className="shelf-spine-art">
                <BookSpine book={book} variant="shelf" />
              </span>
              <span className="shelf-spine-meta">
                <span className="shelf-spine-author" lang={isBengali(author) ? "bn" : "en"}>{author}</span>
                <span className="shelf-spine-year">{year}</span>
              </span>
            </a>
          </li>;
        })}
      </ul>
      {shown < results.length && <div className="shelf-more"><button type="button" onClick={() => setView((current) => ({ ...current, shown: current.shown + batchSize }))} className="ui-button-secondary">{t("shelf.more", { n: numFor(Math.min(batchSize, results.length - shown), locale) })}</button></div>}
    </>}
  </div>;
}
