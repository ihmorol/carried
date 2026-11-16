import Link from "next/link";
import { ArrowRight, Books, Quotes } from "@phosphor-icons/react/dist/ssr";
import { Header, Footer } from "@/components/Chrome";
import { RecentFeed } from "@/components/RecentFeed";
import { ShelfExplorer } from "@/components/ShelfExplorer";
import { ReadingRoom } from "@/components/ReadingRoom";
import { FeaturedPairCarousel } from "@/components/FeaturedPairCarousel";
import { T } from "@/components/T";
import { marqueeLines, lineOfTheDay, seedLinesFor } from "@/lib/seeds";
import { getBook } from "@/lib/books";
import { resolveCovers } from "@/lib/book-covers";
import type { FeaturedPair } from "@/lib/featured-pair";

export const revalidate = 3600;

export default async function Home() {
  const daily = lineOfTheDay();
  const slugs = [...new Set([daily.b, "the-little-prince", "shesher-kobita", "the-alchemist", "pather-panchali"])].slice(0, 5);
  const covers = await resolveCovers(slugs);
  const pairs = slugs.map((slug): FeaturedPair => ({ book: getBook(slug)!, line: slug === daily.b ? daily : seedLinesFor(slug)[0], cover: covers[slug] ?? undefined }));

  return (
    <>
      <Header />
      <ReadingRoom>
        <nav className="workspace-jumps" aria-labelledby="workspace-jump-label">
          <span id="workspace-jump-label" className="sr-only"><T k="home.jump" /></span>
          <a href="#shelf"><Books size={18} aria-hidden="true" /><T k="home.jumpShelf" /></a>
          <a href="#reader-lines"><Quotes size={18} aria-hidden="true" /><T k="home.jumpLines" /></a>
          <Link href={`/b/${daily.b}#write`}><T k="nav.write" /><ArrowRight size={18} aria-hidden="true" /></Link>
        </nav>
        <FeaturedPairCarousel pairs={pairs} />
        <section id="shelf" className="home-shelf" aria-labelledby="workspace-shelf-heading" tabIndex={-1}>
          <div className="home-section-heading">
            <h2 id="workspace-shelf-heading"><T k="shelf.title" /></h2>
            <Link href="/books"><T k="home.allBooks" /><ArrowRight size={18} aria-hidden="true" /></Link>
          </div>
          <ShelfExplorer variant="workspace" pageSize={20} searchPlacement="header" />
        </section>
        <section id="reader-lines" className="home-reader-lines" aria-label="Reader lines" tabIndex={-1}>
          <RecentFeed seeds={marqueeLines()} variant="cards" />
        </section>
      </ReadingRoom>
      <Footer />
    </>
  );
}
