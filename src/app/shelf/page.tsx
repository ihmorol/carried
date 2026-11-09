"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Header, Footer } from "@/components/Chrome";
import { LineCard } from "@/components/LineCard";
import { useLocale } from "@/components/LocaleProvider";
import { getShelf, isShelfStorageBlocked, subscribeShelf, type ShelfEntry } from "@/lib/shelf";
import { bookForPayload, originalName } from "@/lib/books";

export default function ShelfPage() {
  const { t } = useLocale();
  const [lines, setLines] = useState<ShelfEntry[] | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");
  useEffect(() => {
    let mounted = true;
    function refresh() { if (mounted) { setLines(getShelf()); setBlocked(isShelfStorageBlocked()); } }
    const unsubscribe = subscribeShelf(refresh);
    void Promise.resolve().then(refresh);
    return () => { mounted = false; unsubscribe(); };
  }, []);
  const results = useMemo(() => {
    const normalized = query.trim().normalize("NFKC").toLocaleLowerCase();
    const matches = (lines ?? []).filter((entry) => {
      const book = bookForPayload(entry.payload);
      return [entry.payload.q, entry.payload.n, entry.payload.b, book?.title, book?.titleBn, book?.author, book?.authorBn]
        .some((value) => value?.normalize("NFKC").toLocaleLowerCase().includes(normalized));
    });
    if (sort === "oldest") return [...matches].reverse();
    if (sort === "book") return [...matches].sort((a, b) => {
      const left = bookForPayload(a.payload); const right = bookForPayload(b.payload);
      return (left ? originalName(left) : a.payload.b).localeCompare(right ? originalName(right) : b.payload.b);
    });
    return matches;
  }, [lines, query, sort]);

  return <><Header /><main className="page-shell mx-auto w-full max-w-6xl flex-1 px-5 py-10 sm:py-14">
    <h1 className="page-title">{t("mine.title")}</h1>
    <p className="mt-4 max-w-xl text-sm leading-relaxed text-[var(--color-ink-soft)]">{t("mine.sub")}</p>
    {blocked && <p role="status" className="panel mt-6 p-4 text-sm">{t("mine.blocked")}</p>}
    {lines === null ? <p role="status" className="panel mt-8 p-6 text-sm">{t("mine.loading")}</p> : lines.length === 0 ? <div className="panel mt-8 p-8">
      <p className="font-serif text-2xl">{t("mine.empty.title")}</p><p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--color-ink-soft)]">{t("mine.empty.sub")}</p>
      <Link href="/#shelf" className="ui-button mt-6">{t("mine.empty.cta")}</Link>
    </div> : <>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <label htmlFor="my-search" className="sr-only">{t("mine.search")}</label><input id="my-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("mine.search")} className="field-input min-w-0 flex-1" />
        <label htmlFor="my-sort" className="sr-only">{t("mine.sort")}</label><select id="my-sort" value={sort} onChange={(e) => setSort(e.target.value)} className="field-input sm:!w-auto"><option value="newest">{t("mine.newest")}</option><option value="oldest">{t("mine.oldest")}</option><option value="book">{t("mine.byBook")}</option></select>
      </div>
      {results.length ? <ul className="mt-8 grid items-start gap-6 sm:grid-cols-2 lg:grid-cols-3">{results.map((entry) => <li key={entry.id}>
        {bookForPayload(entry.payload) ? <LineCard payload={entry.payload} id={entry.id} asLink className="h-full" />
          : <Link href={`/l/${entry.id}`} className="panel block p-6"><p className="font-serif text-xl leading-relaxed">{entry.payload.q}</p><p className="mt-4 text-sm">{entry.payload.n}</p><p className="mt-3 text-[13px] text-[var(--color-ink-soft)]">{t("mine.legacy")}</p></Link>}
      </li>)}</ul>
        : <p role="status" className="panel mt-6 p-6 text-sm">{t("mine.noMatch")}</p>}
    </>}
  </main><Footer /></>;
}
