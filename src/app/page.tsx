import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { Header, Footer } from "@/components/Chrome";
import { RecentFeed } from "@/components/RecentFeed";
import { LineCard } from "@/components/LineCard";
import { BookSpine } from "@/components/BookSpine";
import { ShelfExplorer } from "@/components/ShelfExplorer";
import { HeroSearch } from "@/components/HeroSearch";
import { T } from "@/components/T";
import { marqueeLines, lineOfTheDay } from "@/lib/seeds";
import { getBook, originalName } from "@/lib/books";

export const revalidate = 3600;

export default function Home() {
  const featured = lineOfTheDay();
  const featuredBook = getBook(featured.b)!;
  const books = ["the-little-prince", "1984", "the-alchemist", "the-hobbit"].map(getBook).filter((book) => book !== undefined);

  return (
    <>
      <Header />
      <main id="main-content" className="page-content">
        <section className="reading-hero">
          <div className="reading-welcome">
            <h1 className="page-title"><T k="home.welcome" /></h1>
            <p><T k="home.sub" /></p>
            <div className="reading-search"><HeroSearch /></div>
          </div>
          <div className="featured-reading">
            <div className="featured-artwork"><LineCard payload={featured} id={featured.id} actions={false} asLink /></div>
            <div className="featured-reading-copy">
              <h2>{originalName(featuredBook)}</h2>
              <p>{featuredBook.authorBn ?? featuredBook.author}</p>
              <p><T k="home.featured" /></p>
              <Link href={`/b/${featured.b}#write`} className="ui-button-secondary"><T k="nav.write" /><ArrowRight size={16} aria-hidden="true" /></Link>
            </div>
          </div>
        </section>

        <section className="reading-section">
          <div className="section-heading"><h2 className="section-title"><T k="home.discover" /></h2><Link href="#shelf"><T k="home.allBooks" /><ArrowRight size={16} aria-hidden="true" /></Link></div>
          <ul className="reading-book-grid">
            {books.map((book) => <li key={book.slug}><Link href={`/b/${book.slug}`} className="book-tile"><div className="book-tile-art"><BookSpine book={book} height={160} /></div><span className="book-tile-title">{originalName(book)}</span><span className="book-tile-author">{book.authorBn ?? book.author}</span></Link></li>)}
          </ul>
        </section>

        <section className="reading-section" aria-label="Reader reflections">
          <RecentFeed seeds={marqueeLines()} />
        </section>

        <section id="shelf" className="reading-section scroll-mt-24">
          <div className="section-heading"><h2 className="section-title"><T k="shelf.title" /></h2></div>
          <ShelfExplorer />
        </section>

        <section className="reading-guide">
          <h2><T k="home.how" /></h2>
          <ol>{[{ title: "band.1.t", copy: "band.1.d" }, { title: "band.2.t", copy: "band.2.d" }, { title: "band.3.t", copy: "band.3.d" }].map((step) => <li key={step.title}><h3><T k={step.title} /></h3><p><T k={step.copy} /></p></li>)}</ol>
        </section>
      </main>
      <Footer />
    </>
  );
}
