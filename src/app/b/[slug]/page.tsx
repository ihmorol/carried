import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header, Footer } from "@/components/Chrome";
import { BookSpine } from "@/components/BookSpine";
import { BookCover } from "@/components/BookCover";
import { BookLinks } from "@/components/BookLinks";
import { LinesFeed } from "@/components/LinesFeed";
import { Composer } from "@/components/Composer";
import { T } from "@/components/T";
import { BOOKS } from "@/lib/books";
import { seedLinesFor } from "@/lib/seeds";
import { SPINE_COLORS } from "@/lib/books";
import { findBook } from "@/lib/store";
import { fetchBookMeta } from "@/lib/bookmeta";

export function generateStaticParams() {
  return BOOKS.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const book = await findBook(slug);
  if (!book) return {};
  return {
    title: `${book.title} — ${book.author}`,
    description: `The lines readers carried out of ${book.title} (${book.author}, ${book.year < 0 ? `${Math.abs(book.year)} BC` : book.year}). What did it leave in you?`,
    alternates: { canonical: `/b/${book.slug}` },
  };
}

export default async function BookPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const book = await findBook(slug);
  if (!book) notFound();

  const seeds = seedLinesFor(slug);
  const spine = SPINE_COLORS[book.spine];
  const meta = await fetchBookMeta(book).catch(() => null);

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-5 pt-10">
          <nav className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-ink-faint)]">
            <Link href="/#shelf" className="link-ledger">The shelf</Link>
            <span className="mx-2" aria-hidden="true">/</span>
            <span className="text-[var(--color-ink-soft)]">{book.title}</span>
          </nav>
        </section>

        <section className="mx-auto grid max-w-6xl gap-12 px-5 py-12 sm:grid-cols-[auto_1fr] sm:gap-16">
          <div className="justify-self-center sm:justify-self-start">
            {meta ? (
              <BookCover src={meta.coverUrl} book={book} />
            ) : (
              <div style={{ transform: "rotate(-1.5deg)" }}>
                <BookSpine book={book} height={300} />
              </div>
            )}
          </div>
          <div className="max-w-2xl">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em]" style={{ color: spine.bg }}>
              {book.tags.map((tag) => (
                <span key={tag} className="inline-block">
                  <T k={`tag.${tag}`} />
                  <span className="mx-1.5">·</span>
                </span>
              ))}
            </p>
            <h1 className="mt-4 font-serif text-5xl font-semibold leading-[1.05]">
              {book.title}
            </h1>
            {book.titleBn && (
              <p className="mt-2 font-serif text-2xl font-semibold text-[var(--color-ink-soft)]">
                {book.titleBn}
              </p>
            )}
            <p className="mt-4 font-mono text-sm text-[var(--color-ink-soft)]">
              {book.authorBn ? `${book.authorBn} · ` : `${book.author} · `}
              {book.year < 0 ? `${Math.abs(book.year)} BC` : book.year}
            </p>
            <p className="drop-cap mt-6 font-mono text-xs leading-relaxed text-[var(--color-ink-soft)]">
              <T k="book.intro" />
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <a
                href="#write"
                className="btn-press rounded-[3px] bg-[var(--color-ink)] px-7 py-4 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-paper)] hover:opacity-85"
              >
                <T k="book.cta" />
              </a>
            </div>
            <div className="mt-8 max-w-sm">
              <BookLinks book={book} workUrl={meta?.workUrl ?? null} />
            </div>
          </div>
        </section>

        {/* the composer — right here, one scroll away, no extra page */}
        <section
          id="write"
          className="mx-auto max-w-6xl scroll-mt-6 border-t px-5 py-14"
          style={{ borderColor: "var(--color-rule)" }}
        >
          <h2 className="max-w-2xl font-serif text-3xl font-semibold leading-tight sm:text-4xl">
            <T k="book.writeQ" v={{ title: book.titleBn ?? book.title }} />
          </h2>
          <p className="mt-3 max-w-xl font-mono text-xs leading-relaxed text-[var(--color-ink-soft)]">
            <T k="book.writeSub" />
          </p>
          <div className="mt-10">
            <Composer book={book} />
          </div>
        </section>

        <section
          id="lines"
          className="mx-auto max-w-6xl scroll-mt-8 border-t px-5 py-14"
          style={{ borderColor: "var(--color-rule)" }}
        >
          <LinesFeed slug={book.slug} seeds={seeds} />
        </section>
      </main>
      <Footer />
    </>
  );
}
