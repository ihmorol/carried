"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BOOKS, originalName, searchBooks, type Book } from "@/lib/books";
import { BookSpine } from "./BookSpine";
import { useLocale } from "./LocaleProvider";

export function HeroSearch() {
  const router = useRouter();
  const { t } = useLocale();
  const uid = useId();
  const inputId = `${uid}-search`;
  const listId = `${uid}-results`;
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [readerBooks, setReaderBooks] = useState<Book[]>([]);
  const boxRef = useRef<HTMLDivElement>(null);
  const books = useMemo(() => [...BOOKS, ...readerBooks.filter((book) => !BOOKS.some((item) => item.slug === book.slug))], [readerBooks]);
  const results = useMemo(() => searchBooks(q, 5, books), [q, books]);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const res = await fetch("/api/books", { cache: "no-store", signal: controller.signal });
        if (!res.ok) return;
        const data = await res.json() as { books?: Book[] };
        if (!controller.signal.aborted && Array.isArray(data.books)) setReaderBooks(data.books.filter((book) => book.tags.includes("reader-added")));
      } catch { /* The curated shelf remains searchable offline. */ }
    }
    void Promise.resolve().then(() => { if (!controller.signal.aborted) void load(); });
    return () => controller.abort();
  }, []);
  const showList = open && q.trim().length > 0;
  const selected = Math.min(active, Math.max(0, results.length - 1));
  const optionId = (book: Book) => `${listId}-${book.slug}`;

  useEffect(() => {
    function outside(e: PointerEvent) {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, []);

  function go(book: Book) {
    setOpen(false);
    setQ("");
    router.push(`/b/${book.slug}#write`);
  }
  function surprise() { go(BOOKS[Math.floor(Math.random() * BOOKS.length)]); }
  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      if (results.length) setActive((i) => !showList ? 0 : (i + (e.key === "ArrowDown" ? 1 : -1) + results.length) % results.length);
    } else if (e.key === "Escape") {
      e.preventDefault(); setOpen(false);
    } else if (e.key === "Enter" && showList && results[selected]) {
      e.preventDefault(); go(results[selected]);
    }
  }

  return (
    <div ref={boxRef} className="relative w-full max-w-xl" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false); }}>
      <form role="search" onSubmit={(e) => { e.preventDefault(); if (results[selected]) go(results[selected]); }}>
        <label htmlFor={inputId} className="sr-only">{t("hero.searchLabel")}</label>
        <div className="flex flex-wrap gap-2 sm:flex-nowrap">
          <input id={inputId} type="text" value={q} onChange={(e) => { setQ(e.target.value); setActive(0); setOpen(true); }}
            onFocus={() => setOpen(true)} onKeyDown={onKeyDown} placeholder={t("hero.searchPlaceholder")} autoComplete="off"
            role="combobox" aria-expanded={showList && results.length > 0} aria-controls={showList && results.length > 0 ? listId : undefined}
            aria-activedescendant={showList && results[selected] ? optionId(results[selected]) : undefined} aria-autocomplete="list"
            className="field-input min-w-0 flex-1" />
          <button type="submit" className="ui-button shrink-0">{t("hero.searchCta")}</button>
        </div>
      </form>
      {showList && (results.length ? (
        <ul id={listId} role="listbox" aria-label={t("shelf.searchLabel")} className="panel absolute z-20 mt-2 w-full overflow-hidden p-1">
          {results.map((book, i) => (
            <li key={book.slug} id={optionId(book)} role="option" aria-selected={i === selected}
              onMouseDown={(e) => e.preventDefault()} onClick={() => go(book)} onMouseEnter={() => setActive(i)}
              className={`flex min-h-16 cursor-pointer items-center gap-4 rounded-lg px-3 py-3 ${i === selected ? "bg-[var(--color-paper)]" : ""}`}>
              <BookSpine book={book} height={48} compact className="shrink-0" />
              <span className="min-w-0"><span className="block font-serif text-base font-semibold">{originalName(book)}</span>
                <span className="block text-[13px] text-[var(--color-ink-soft)]">{book.authorBn ?? book.author}</span></span>
              <span aria-hidden="true" className="ml-auto">→</span>
            </li>
          ))}
        </ul>
      ) : <div className="panel absolute z-20 mt-2 w-full p-4 text-sm"><p role="status">{t("shelf.empty.title")}</p><a href="#shelf" className="ui-button-secondary mt-3">{t("home.allBooks")}</a></div>)}
      <p className="mt-3 flex flex-wrap items-center gap-1 text-[13px] text-[var(--color-ink-soft)]">
        {t("hero.noIdea")} <button type="button" onClick={surprise} className="min-h-11 px-2 underline underline-offset-4">{t("hero.surprise")}</button>
      </p>
    </div>
  );
}
