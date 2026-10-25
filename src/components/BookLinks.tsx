import type { Book } from "@/lib/books";
import { bookArchiveLinks } from "@/lib/bookmeta";

/**
 * "Find the book" — free archives first, then honest ways to get it.
 * Search-page links only, so we never claim availability we can't verify.
 */
export function BookLinks({ book, workUrl }: { book: Book; workUrl: string | null }) {
  const links = [
    ...(workUrl
      ? [{ label: "Open Library", hint: "read or borrow free", href: workUrl }]
      : []),
    ...bookArchiveLinks(book),
  ];

  return (
    <div className="card-rule rounded-[4px] bg-[var(--color-paper-raised)] p-5">
      <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-ink-soft)]">
        Find the book
      </p>
      <ul className="mt-3 space-y-2">
        {links.map((l) => (
          <li key={l.label} className="flex items-baseline justify-between gap-3">
            <a
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="link-ledger font-mono text-xs text-[var(--color-ink)]"
            >
              {l.label} <span aria-hidden="true">↗</span>
            </a>
            <span className="text-right font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
              {l.hint}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
