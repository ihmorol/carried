"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BOOKS, searchBooks, type Book } from "@/lib/books";
import { BookSpine } from "./BookSpine";
import { useLocale } from "./LocaleProvider";

/**
 * The hero's real CTA: type a book you love, land on its margin in one
 * action. Instant suggestions, Enter takes the first hit, and "surprise
 * me" drops you into a random shelf — the fastest path to a rabbit hole.
 */
export function HeroSearch() {
  const router = useRouter();
  const { t } = useLocale();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);

  const results = useMemo<Book[]>(() => searchBooks(q, 5), [q]);
  const showList = open && q.trim().length > 0;

  useEffect(() => {
    function onDocDown(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, []);

  function go(book: Book) {
    setOpen(false);
    setQ("");
    router.push(`/b/${book.slug}#write`);
  }

  function surprise() {
    const book = BOOKS[Math.floor(Math.random() * BOOKS.length)];
    router.push(`/b/${book.slug}#write`);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const book = results[active] ?? results[0];
      if (book) go(book);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={boxRef} className="relative max-w-xl">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const book = results[active] ?? results[0];
          if (book) go(book);
        }}
        role="search"
      >
        <label htmlFor="hero-search" className="sr-only">
          {t("hero.searchLabel")}
        </label>
        <div className="flex">
          <input
            id="hero-search"
            type="text"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
              setActive(0);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder={t("hero.searchPlaceholder")}
            autoComplete="off"
            role="combobox"
            aria-expanded={showList}
            aria-controls="hero-results"
            aria-autocomplete="list"
            className="w-full rounded-l-[3px] border border-r-0 bg-[var(--color-paper-raised)] px-5 py-4 font-mono text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none"
            style={{ borderColor: "var(--color-ink)" }}
          />
          <button
            type="submit"
            className="btn-press shrink-0 rounded-r-[3px] bg-[var(--color-stamp)] px-5 py-4 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-paper-raised)] hover:opacity-85"
          >
            {t("hero.searchCta")}
          </button>
        </div>
      </form>

      {showList && (
        <ul
          id="hero-results"
          role="listbox"
          aria-label={t("shelf.searchLabel")}
          className="card-rule absolute z-20 mt-2 w-full overflow-hidden rounded-[4px] bg-[var(--color-paper-raised)] shadow-[0_14px_34px_rgba(28,22,12,0.18)]"
        >
          {results.length === 0 ? (
            <li className="px-5 py-4 font-mono text-xs text-[var(--color-ink-soft)]">
              {t("shelf.missing")}{" "}
              <button type="button" onClick={surprise} className="link-ledger text-[var(--color-stamp)]">{t("hero.surprise")}</button>{" "}
              <a href="#shelf" className="link-ledger">…</a>
            </li>
          ) : (
            results.map((b, i) => (
              <li key={b.slug} role="option" aria-selected={i === active}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    go(b);
                  }}
                  onMouseEnter={() => setActive(i)}
                  className={`flex w-full items-center gap-4 px-4 py-3 text-left transition-colors ${
                    i === active ? "bg-[var(--color-paper)]" : ""
                  }`}
                >
                  <BookSpine book={b} height={56} compact className="shrink-0" />
                  <span className="min-w-0">
                    <span className="block truncate font-serif text-base font-semibold text-[var(--color-ink)]">
                      {b.title}
                    </span>
                    <span className="block font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">
                      {b.author} · {b.year < 0 ? `${Math.abs(b.year)} BC` : b.year}
                    </span>
                  </span>
                  <span
                    aria-hidden="true"
                    className="ml-auto shrink-0 font-mono text-xs text-[var(--color-ink-faint)]"
                  >
                    →
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}

      <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--color-ink-faint)]">
        {t("hero.noIdea")}{" "}
        <button
          type="button"
          onClick={surprise}
          className="link-ledger text-[var(--color-ink)]"
        >
          {t("hero.surprise")}
        </button>
        {t("hero.surpriseNote")}
      </p>
    </div>
  );
}
