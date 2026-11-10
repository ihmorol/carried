import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Tote } from "@phosphor-icons/react/dist/ssr";
import { Header, Footer } from "@/components/Chrome";
import { LineCard } from "@/components/LineCard";
import { Composer } from "@/components/Composer";
import { LocalSaveNotice } from "@/components/LocalSaveNotice";
import { ShareRow } from "@/components/ShareRow";
import { T } from "@/components/T";
import { seedLinesFor } from "@/lib/seeds";
import { originalName, getBook } from "@/lib/books";
import { selectionHref } from "@/lib/commerce/personalization";
import { resolveBookForLine, enrichLineBook, findBook, getStore, resolveLine } from "@/lib/store";

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ restyle?: string | string[] }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const payload = await resolveLine(id);
  if (!payload) return { title: "A line, unreadable", robots: { index: false } };
  const book = await resolveBookForLine(payload);
  const short = payload.q.length > 110 ? `${payload.q.slice(0, 110).trimEnd()}…` : payload.q;
  return {
    title: `“${short}”, carried by ${payload.n}`,
    description: `A line carried out of ${book ? originalName(book) : "a book"}, by ${payload.n}. What did it leave in you?`,
    robots: { index: false },
  };
}

export default async function LinePage({ params, searchParams }: Props) {
  const { id } = await params;
  const raw = await resolveLine(id);
  if (!raw) notFound();
  const book = await resolveBookForLine(raw);
  if (!book) notFound();
  const payload = enrichLineBook(raw, book);
  const others = seedLinesFor(payload.b).filter((line) => line.q !== payload.q).slice(0, 3);
  const counts = await getStore().getVoteCounts([id, ...others.map((line) => line.id)]).catch(() => new Map<string, number>());
  const merchandiseUrl = selectionHref("/shop", { payload, sourceId: id, isExample: false });
  const recreateUrl = `/l/${id}?restyle=1#write`;
  const onShelf = getBook(book.slug) ?? await findBook(book.slug).catch(() => undefined);
  const restyle = (await searchParams)?.restyle === "1";

  return (
    <>
      <Header />
      <main id="main-content" className="page-content">
        <div className="card-workspace">
          <div className="card-workspace-art"><LineCard payload={payload} book={book} id={id} size="lg" animateStamp votes={counts.get(id) ?? 0} /></div>
          <div className="card-workspace-copy">
            <h1 className="page-title"><T k="card.ready" /></h1>
            <p><T k="card.travel" /></p>
            <LocalSaveNotice id={id} payload={payload} />
            <div><ShareRow payload={payload} id={id} /></div>
            <p><Link href={recreateUrl} className="link-ledger inline-flex min-h-11 items-center"><T k="card.restyle" /></Link></p>
            <div className="border-t border-[var(--color-rule)] pt-6">
              <Link href={merchandiseUrl} className="ui-button-secondary"><Tote size={19} aria-hidden="true" /><T k="card.shop" /></Link>
              <p className="muted mt-3 text-xs"><T k="card.shopNote" /></p>
            </div>
          </div>
        </div>
        {restyle && <section id="write" className="reading-section" aria-labelledby="restyle-heading">
          <h2 id="restyle-heading" className="section-title mb-3"><T k="card.restyle" /></h2>
          <p className="mb-6 text-sm text-[var(--color-ink-soft)]"><T k="card.restyleNote" /></p>
          <Composer book={book} initialPayload={payload} sourceId={id} creationMode={onShelf ? "public" : "link-only"} />
        </section>}
        <section className="card-loop">
          <h2 className="section-title"><T k="card.loop.h" v={{ title: originalName(book) }} /></h2>
          <p><T k="card.loop.sub" v={{ n: payload.n }} /></p>
          <Link href={onShelf ? `/b/${book.slug}#write` : "/books"} className="ui-button"><T k="card.loop.cta" /><ArrowRight size={17} aria-hidden="true" /></Link>
        </section>
        {others.length > 0 && <section className="reading-section"><h2 className="section-title mb-6"><T k="card.more" v={{ title: originalName(book) }} /></h2><ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">{others.map((line) => <li key={line.id}><LineCard payload={line} id={line.id} asLink votes={counts.get(line.id) ?? 0} className="h-full" /></li>)}</ul></section>}
      </main>
      <Footer />
    </>
  );
}
