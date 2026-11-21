"use client";

import type { Book } from "@/lib/books";
import { bookArchiveLinks } from "@/lib/bookmeta";
import { useLocale } from "./LocaleProvider";

/** Labels follow the resolved origin, including Internet Archive fallbacks. */
export function BookLinks({ book, workUrl }: { book: Book; workUrl: string | null }) {
  const { t } = useLocale();
  const links = bookArchiveLinks(book).map((link) => ({ ...link, hintKey: link.href.includes("bookshop.org") ? "book.shop" : link.href.includes("worldcat.org") ? "book.wc" : "book.ia" }));
  if (workUrl) {
    try {
      const url = new URL(workUrl);
      const host = url.hostname;
      if (url.protocol === "https:" && (host === "openlibrary.org" || host === "archive.org")) {
        links.unshift({ label: host === "archive.org" ? "Internet Archive" : "Open Library", hint: "", hintKey: host === "archive.org" ? "book.ia" : "book.ol", href: workUrl });
      }
    } catch { /* Keep the generic search links. */ }
  }
  return <div className="panel p-5">
    <p className="text-sm font-medium">{t("book.find")}</p>
    <ul className="mt-3 space-y-1">{links.map((link) => <li key={link.href} className="flex flex-wrap items-center justify-between gap-x-3">
      <a href={link.href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1 text-sm underline underline-offset-4">{link.label} <span aria-hidden="true">↗</span></a>
      <span className="text-[13px] text-[var(--color-ink-soft)]">{t(link.hintKey)}</span>
    </li>)}</ul>
  </div>;
}
