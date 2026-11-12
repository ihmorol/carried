import type { Metadata } from "next";
import { Header, Footer } from "@/components/Chrome";
import { ReaderLinesFeed } from "@/components/ReaderLinesFeed";
import { T } from "@/components/T";
import { marqueeLines } from "@/lib/seeds";

export const metadata: Metadata = {
  title: "Reader lines",
  description: "The freshest lines carried out of the shelf, one card at a time.",
  alternates: { canonical: "/lines" },
};

/** The reader-lines page behind the sidebar's Lines button. The home
 * workspace keeps its #reader-lines anchor; here the whole shelf's cards
 * get a full page with the live feed on top of the editorial collection. */
export default function LinesPage() {
  return (
    <>
      <Header />
      <main id="main-content" className="page-shell mx-auto w-full max-w-6xl flex-1 px-5 py-10 sm:py-14">
        <header className="max-w-2xl">
          <h1 className="page-title"><T k="lines.title" /></h1>
          <p className="mt-4 text-sm leading-relaxed text-[var(--color-ink-soft)] sm:text-base"><T k="lines.sub" /></p>
        </header>
        <div className="mt-10">
          <ReaderLinesFeed seeds={marqueeLines()} />
        </div>
      </main>
      <Footer />
    </>
  );
}
