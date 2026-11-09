import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Header, Footer } from "@/components/Chrome";
import { BookSpine } from "@/components/BookSpine";
import { BookLinks } from "@/components/BookLinks";
import { LinesFeed } from "@/components/LinesFeed";
import { Composer } from "@/components/Composer";
import { T } from "@/components/T";
import { BOOKS, originalName, type Book } from "@/lib/books";
import { seedLinesFor } from "@/lib/seeds";
import { findBook } from "@/lib/store";
import { fetchBookMeta } from "@/lib/bookmeta";

export function generateStaticParams() {
  return BOOKS.map((book) => ({ slug: book.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const book = await findBook(slug);
  if (!book) return {};
  return {
    title: `${originalName(book)}, ${book.authorBn ?? book.author}`,
    description: `The lines readers carried out of ${originalName(book)}. What did it leave in you?`,
    alternates: { canonical: `/b/${book.slug}` },
  };
}

async function ReadingLinks({ book }: { book: Book }) {
  const meta = await fetchBookMeta(book).catch(() => null);
  return <BookLinks book={book} workUrl={meta?.workUrl ?? null} />;
}

export default async function BookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const book = await findBook(slug);
  if (!book) notFound();
  const seeds = seedLinesFor(slug);

  return (
    <>
      <Header />
      <main id="main-content" className="page-content">
        <nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/#shelf"><T k="nav.shelf" /></Link><span aria-hidden="true">/</span><span>{originalName(book)}</span></nav>
        <section className="book-introduction">
          <div className="justify-self-center"><BookSpine book={book} height={180} /></div>
          <div>
            <div className="book-tags">{book.tags.slice(0, 3).map((tag) => <span key={tag}><T k={`tag.${tag}`} /></span>)}</div>
            <h1 className="page-title">{originalName(book)}</h1>
            {book.titleBn && <p className="muted mt-2 font-serif text-xl">{book.title}</p>}
            <p className="muted mt-3">{book.authorBn ?? book.author} · {book.year < 0 ? `${Math.abs(book.year)} BC` : book.year}</p>
          </div>
        </section>
        <section id="write" className="writing-section">
          <h2 className="section-title"><T k="book.writeQ" v={{ title: originalName(book) }} /></h2>
          <p><T k="book.writeSub" /></p>
          <div className="mt-8"><Composer book={book} /></div>
        </section>
        <section className="book-links-section" aria-label="Find the book">
          <Suspense fallback={<p className="muted text-sm"><T k="book.linksLoading" /></p>}><ReadingLinks book={book} /></Suspense>
        </section>
        <section id="lines" className="book-margin"><LinesFeed slug={book.slug} seeds={seeds} /></section>
      </main>
      <Footer />
    </>
  );
}
