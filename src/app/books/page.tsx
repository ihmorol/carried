import type { Metadata } from "next";
import { Header, Footer } from "@/components/Chrome";
import { ShelfExplorer } from "@/components/ShelfExplorer";
import { T } from "@/components/T";

export const metadata: Metadata = {
  title: "The shelf",
  description: "The wall of books readers carry. Pick one and write the line it left in you.",
  alternates: { canonical: "/books" },
};

/** The catalog behind the sidebar's shelf button. The home workspace keeps
 * its #shelf anchor; this page is the same explorer with room to breathe. */
export default function BooksPage() {
  return (
    <>
      <Header />
      <main id="main-content" className="page-shell mx-auto w-full max-w-6xl flex-1 px-5 py-10 sm:py-14">
        <header className="max-w-2xl">
          <h1 className="page-title"><T k="books.title" /></h1>
          <p className="mt-4 text-sm leading-relaxed text-[var(--color-ink-soft)] sm:text-base"><T k="books.sub" /></p>
        </header>
        <div className="mt-10">
          <ShelfExplorer />
        </div>
      </main>
      <Footer />
    </>
  );
}
