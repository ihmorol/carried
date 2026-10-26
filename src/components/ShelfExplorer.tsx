"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BOOKS, searchBooks, type Book } from "@/lib/books";
import { BookSpine } from "./BookSpine";
import { usePoll } from "@/lib/use-poll";
import { useLocale } from "./LocaleProvider";
import { numFor } from "@/lib/i18n";

const TAGS = ["all", "fiction", "classic", "philosophy", "psychology", "poetry", "fantasy", "scifi", "memoir", "self", "money", "play", "bangla", "reader-added"] as const;

/** Muted book-cloth hues so each filter reads as its own shelf. */
const TAG_COLORS: Partial<Record<(typeof TAGS)[number], string>> = {
  fiction: "#8a5a44",
  classic: "#6d6354",
  philosophy: "#3f6b62",
  psychology: "#7a5a6e",
  poetry: "#8a6d3b",
  fantasy: "#3f5a3a",
  scifi: "#40597a",
  memoir: "#8a4a3b",
  self: "#5a6b4a",
  money: "#6b5a2a",
  play: "#5a3a50",
  bangla: "#1f6b46",
  "reader-added": "#b23c25",
};

/**
 * The public shelf: instant search over the curated 110 plus every
 * reader-added book (fetched from the live shelf), and the form that
 * adds missing books, two fields, one click to its page.
 */
export function ShelfExplorer() {
  const router = useRouter();
  const { t, locale } = useLocale();
  const [userBooks, setUserBooks] = useState<Book[]>([]);
  const [live, setLive] = useState(false);
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState<(typeof TAGS)[number]>("all");
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [year, setYear] = useState("");
  const [bookError, setBookError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/books", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { books: Book[]; live: boolean };
      setLive(data.live);
      setUserBooks(data.books.filter((b) => b.tags.includes("reader-added")));
    } catch {
      /* offline, curated shelf only */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) refresh();
    });
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  usePoll(refresh, 15000);

  const all = useMemo(() => [...BOOKS, ...userBooks.filter((u) => !BOOKS.some((b) => b.slug === u.slug))], [userBooks]);

  const results = useMemo<Book[]>(() => {
    const q = query.trim();
    if (q) {
      const local = searchBooks(q);
      const extra = userBooks.filter(
        (b) =>
          !local.some((l) => l.slug === b.slug) &&
          (b.title.toLowerCase().includes(q.toLowerCase()) || b.author.toLowerCase().includes(q.toLowerCase())),
      );
      return [...local, ...extra].slice(0, 60);
    }
    if (tag !== "all") {
      const byTag = all.filter((b) => b.tags.includes(tag));
      return byTag.length ? byTag : all;
    }
    return all;
  }, [query, tag, all, userBooks]);

  async function addBook(e: React.FormEvent) {
    e.preventDefault();
    setBookError(null);
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title,
          author,
          year: year ? Number(year) : undefined,
        }),
      });
      const data = (await res.json()) as { book?: Book; error?: string };
      if (!res.ok || !data.book) {
        setBookError(data.error ?? "The shelf hiccuped. Try again.");
        return;
      }
      setUserBooks((prev) => [...prev.filter((b) => b.slug !== data.book!.slug), data.book!]);
      router.push(`/b/${data.book.slug}`);
    } catch {
      setBookError("The live shelf is offline, see README to connect it.");
    } finally {
      setSaving(false);
    }
  }

  const field =
    "w-full rounded-[3px] border bg-[var(--color-paper-raised)] px-3.5 py-2.5 font-mono text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none";

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <label htmlFor="shelf-search" className="sr-only">
            {t("shelf.searchLabel")}
          </label>
          <input
            id="shelf-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("shelf.placeholder")}
            autoComplete="off"
            className="w-full rounded-[3px] border bg-[var(--color-paper-raised)] px-4 py-3 font-mono text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none"
            style={{ borderColor: "var(--color-rule)" }}
          />
        </div>
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          aria-expanded={adding}
          className={`shrink-0 rounded-[3px] border px-4 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors ${
            adding
              ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-paper)]"
              : "border-[var(--color-stamp)] text-[var(--color-stamp)] hover:opacity-80"
          }`}
        >
          {adding ? t("shelf.close") : t("shelf.add")}
        </button>
      </div>

      {adding && (
        <form
          onSubmit={addBook}
          className="card-rule mt-4 rounded-[4px] bg-[var(--color-paper-raised)] p-5"
        >
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--color-ink-soft)]">
            {t("shelf.missing")}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_110px_auto]">
            <div>
              <label htmlFor="nb-title" className="sr-only">{t("shelf.fTitle")}</label>
              <input id="nb-title" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("shelf.fTitle")} className={field} maxLength={90} />
            </div>
            <div>
              <label htmlFor="nb-author" className="sr-only">{t("shelf.fAuthor")}</label>
              <input id="nb-author" required value={author} onChange={(e) => setAuthor(e.target.value)} placeholder={t("shelf.fAuthor")} className={field} maxLength={60} />
            </div>
            <div>
              <label htmlFor="nb-year" className="sr-only">{t("shelf.fYear")}</label>
              <input id="nb-year" inputMode="numeric" value={year} onChange={(e) => setYear(e.target.value.replace(/[^0-9-]/g, ""))} placeholder={t("shelf.fYear")} className={field} maxLength={5} />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="rounded-[3px] bg-[var(--color-ink)] px-5 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-paper)] transition-opacity hover:opacity-85 disabled:opacity-40"
            >
              {saving ? t("shelf.shelving") : t("shelf.shelve")}
            </button>
          </div>
          {bookError && (
            <p role="alert" className="mt-3 font-mono text-xs text-[var(--color-stamp)]">
              {bookError}
            </p>
          )}
        </form>
      )}

      <div className="mt-4 flex flex-wrap gap-1.5" role="group" aria-label="Filter by kind">
        {TAGS.map((tagId) => {
          const active = tag === tagId && !query.trim();
          const color = TAG_COLORS[tagId];
          const style = active
            ? undefined
            : color
              ? { borderColor: `${color}99`, color }
              : { borderColor: "var(--color-rule)", color: "var(--color-ink-soft)" };
          return (
            <button
              key={tagId}
              type="button"
              onClick={() => {
                setTag(tagId);
                setQuery("");
              }}
              aria-pressed={active}
              style={style}
              className={`rounded-full border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors ${
                active
                  ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-paper)]"
                  : "hover:brightness-75"
              }`}
            >
              {t(`tag.${tagId}`)}
            </button>
          );
        })}
      </div>

      <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-ink-soft)]" aria-live="polite">
        {t("shelf.count.many", { n: numFor(results.length, locale) })}
        {query.trim() ? t("shelf.for", { q: query.trim() }) : ""}
        {live ? "" : t("shelf.offline")}
      </p>

      {results.length === 0 ? (
        <div className="card-rule mt-6 rounded-[4px] bg-[var(--color-paper-raised)] p-10 text-center">
          <p className="font-serif text-xl italic">{t("shelf.empty.title")}</p>
          <button
            type="button"
            onClick={() => {
              setTitle(query.trim());
              setAdding(true);
            }}
            className="link-ledger mt-2 font-mono text-xs uppercase tracking-[0.14em]"
          >
            {t("shelf.empty.cta", { q: query.trim() })}
          </button>
        </div>
      ) : (
        <ul className="mt-6 flex flex-wrap items-end gap-x-4 gap-y-7">
          {results.map((b) => (
            <li key={b.slug}>
              <a
                href={`/b/${b.slug}`}
                className="spine-hover group block"
                aria-label={`${b.title} by ${b.author}`}
              >
                <BookSpine book={b} />
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
