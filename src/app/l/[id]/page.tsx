import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header, Footer } from "@/components/Chrome";
import { LineCard } from "@/components/LineCard";
import { TiltCard } from "@/components/TiltCard";
import { ShareRow } from "@/components/ShareRow";
import { T } from "@/components/T";
import { seedLinesFor } from "@/lib/seeds";
import { bookForPayload, originalName } from "@/lib/books";
import { findBook, getStore, resolveLine } from "@/lib/store";
import { tiltFor } from "@/lib/tilt";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const p = await resolveLine(id);
  if (!p) return { title: "A line, unreadable", robots: { index: false } };
  const book = (await findBook(p.b)) ?? bookForPayload(p);
  const short = p.q.length > 110 ? `${p.q.slice(0, 110).trimEnd()}…` : p.q;
  return {
    title: `“${short}”, carried by ${p.n}`,
    description: `A line carried out of ${book?.title ?? "a book"}, by ${p.n}. What did it leave in you?`,
    robots: { index: false },
  };
}

export default async function LinePage({ params }: Props) {
  const { id } = await params;

  const payload = await resolveLine(id);
  if (!payload) notFound();

  // the live shelf decides book existence; the URL itself carries the
  // book for reader-added lines, so the card renders stateless
  const onShelf = await findBook(payload.b);
  const book = onShelf ?? bookForPayload(payload);
  if (!book) notFound();

  const others = seedLinesFor(payload.b).filter((l) => l.q !== payload.q).slice(0, 3);
  const counts = await getStore()
    .getVoteCounts([id, ...others.map((o) => o.id)])
    .catch(() => new Map<string, number>());

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-5 pb-10 pt-12 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--color-ink-soft)]">
            <T k="card.kicker" />
          </p>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-12">
          <div className="mx-auto w-[420px] max-w-full">
            <TiltCard max={6}>
              <LineCard payload={payload} id={id} size="lg" animateStamp votes={counts.get(id) ?? 0} />
            </TiltCard>
          </div>

          <div className="mx-auto mt-12 flex max-w-2xl flex-col items-center gap-8">
            <ShareRow payload={payload} id={id} />
            <p className="max-w-md text-center font-mono text-[11px] leading-relaxed text-[var(--color-ink-faint)]">
              <T k="card.travel" />
            </p>
          </div>
        </section>

        {/* the loop, every visitor is invited to carry their own */}
        <section
          className="border-y py-20"
          style={{ borderColor: "var(--color-rule)" }}
        >
          <div className="mx-auto max-w-4xl px-5">
            <h2 className="display-lg">
              <T k="card.loop.h" v={{ title: originalName(book) }} />
            </h2>
            <p className="mt-6 max-w-md font-mono text-xs leading-relaxed text-[var(--color-ink-soft)]">
              <T k="card.loop.sub" v={{ n: payload.n }} />
            </p>
            <Link
              href={onShelf ? `/b/${book.slug}#write` : "/#shelf"}
              className="btn-press mt-10 inline-block rounded-[3px] bg-[var(--color-ink)] px-7 py-4 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-paper)]"
            >
              <T k="card.loop.cta" />
            </Link>
          </div>
        </section>

        {others.length > 0 && (
          <section className="mx-auto max-w-6xl px-5 py-16">
            <h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--color-ink-soft)]">
              <T k="card.more" v={{ title: originalName(book) }} />
            </h3>
            <ul className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((l) => (
                <li
                  key={l.id}
                  className="toss max-w-[360px]"
                  style={{ "--tilt": `${tiltFor(l.id)}deg` } as React.CSSProperties}
                >
                  <LineCard payload={l} id={l.id} asLink votes={counts.get(l.id) ?? 0} className="h-full" />
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
