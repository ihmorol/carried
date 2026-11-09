import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, Books, Quotes } from "@phosphor-icons/react/dist/ssr";
import { Header, Footer } from "@/components/Chrome";
import { RecentFeed } from "@/components/RecentFeed";
import { LineCard } from "@/components/LineCard";
import { FrontCover } from "@/components/FrontCover";
import { ShelfExplorer } from "@/components/ShelfExplorer";
import { T } from "@/components/T";
import { marqueeLines, lineOfTheDay } from "@/lib/seeds";
import { getBook, originalName, type Book } from "@/lib/books";
import { resolveCovers } from "@/lib/book-covers";
import { isBengali } from "@/lib/line";

export const revalidate = 3600;

/** The featured book's front cover, resolved on the server while the page renders. */
async function FeaturedBookCover({ book }: { book: Book }) {
  const covers = await resolveCovers([book.slug]);
  return (
    <FrontCover
      slug={book.slug}
      title={originalName(book)}
      author={book.authorBn ?? book.author}
      spine={book.spine}
      src={covers[book.slug] ?? undefined}
      featured
    />
  );
}

export default function Home() {
  const featured = lineOfTheDay();
  const featuredBook = getBook(featured.b)!;
  const title = originalName(featuredBook);
  const author = featuredBook.authorBn ?? featuredBook.author;

  return (
    <>
      <Header />
      <main id="main-content" className="reading-workspace" tabIndex={-1}>
        <nav className="workspace-jumps" aria-labelledby="workspace-jump-label">
          <span id="workspace-jump-label" className="sr-only"><T k="home.jump" /></span>
          <a href="#shelf"><Books size={18} weight="regular" aria-hidden="true" /><T k="home.jumpShelf" /></a>
          <a href="#reader-lines"><Quotes size={18} weight="regular" aria-hidden="true" /><T k="home.jumpLines" /></a>
        </nav>
        <div className="workspace-columns">
          <section id="shelf" className="workspace-shelf" aria-labelledby="workspace-shelf-heading" tabIndex={-1}>
            <ShelfExplorer variant="workspace" pageSize={8}>
              <div className="workspace-welcome">
                <h1><T k="home.welcome" /></h1>
                <p><T k="home.sub" /></p>
              </div>
              <div className="workspace-book">
                <div className="workspace-book-art">
                  <Suspense fallback={<FrontCover slug={featuredBook.slug} title={title} author={author} spine={featuredBook.spine} featured />}>
                    <FeaturedBookCover book={featuredBook} />
                  </Suspense>
                </div>
                <div className="workspace-book-copy">
                  <h2 lang={isBengali(title) ? "bn" : "en"}>{title}</h2>
                  <p className="workspace-book-author" lang={isBengali(author) ? "bn" : "en"}>{author}</p>
                  <p className="workspace-eyebrow"><T k="home.featuredBook" /></p>
                  <Link href={`/b/${featured.b}`} className="workspace-book-link"><T k="home.openBook" /><ArrowRight size={16} weight="regular" aria-hidden="true" /></Link>
                </div>
              </div>
              <div className="workspace-section-heading"><h2 id="workspace-shelf-heading"><T k="shelf.title" /></h2></div>
            </ShelfExplorer>
          </section>
          <section id="reader-lines" className="workspace-lines" aria-labelledby="workspace-lines-heading" tabIndex={-1}>
            <div className="workspace-daily-heading">
              <span id="workspace-lines-heading" className="sr-only"><T k="nav.lines" /></span>
              <h2><T k="home.daily" /></h2>
              <p><T k="home.featured" /></p>
            </div>
            <div className="workspace-daily-card"><LineCard payload={featured} id={featured.id} actions={false} asLink /></div>
            <div className="workspace-daily-book">
              <Link href={`/b/${featured.b}`} lang={isBengali(title) ? "bn" : "en"}>{title}</Link>
              <p lang={isBengali(author) ? "bn" : "en"}>{author}</p>
            </div>
            <Link href={`/b/${featured.b}#write`} className="ui-button workspace-write"><T k="nav.write" /><ArrowRight size={18} weight="regular" aria-hidden="true" /></Link>
            <RecentFeed seeds={marqueeLines()} variant="list" />
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
