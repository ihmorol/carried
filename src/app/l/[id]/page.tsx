import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header, Footer } from "@/components/Chrome";
import { LineCard } from "@/components/LineCard";
import { ShareRow } from "@/components/ShareRow";
import { decodeLine, LineError } from "@/lib/line";
import { seedLinesFor } from "@/lib/seeds";
import { findBook } from "@/lib/store";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const p = decodeLine(id);
    const book = await findBook(p.b);
    const short = p.q.length > 110 ? `${p.q.slice(0, 110).trimEnd()}…` : p.q;
    return {
      title: `“${short}” — carried by ${p.n}`,
      description: `A line carried out of ${book?.title ?? "a book"}, by ${p.n}. What did it leave in you?`,
      robots: { index: false },
    };
  } catch {
    return { title: "A line, unreadable", robots: { index: false } };
  }
}

export default async function LinePage({ params }: Props) {
  const { id } = await params;

  let payload;
  try {
    payload = decodeLine(id);
  } catch (err) {
    if (err instanceof LineError) notFound();
    throw err;
  }

  const book = await findBook(payload.b);
  if (!book) notFound();

  const others = seedLinesFor(payload.b).filter((l) => l.q !== payload.q).slice(0, 3);

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-5 pb-10 pt-12 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--color-ink-soft)]">
            This line is yours now
          </p>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-12">
          <div className="mx-auto w-[420px] max-w-full">
            <LineCard payload={payload} id={id} size="lg" animateStamp />
          </div>

          <div className="mx-auto mt-12 flex max-w-2xl flex-col items-center gap-8">
            <ShareRow payload={payload} id={id} />
            <p className="max-w-md text-center font-mono text-[11px] leading-relaxed text-[var(--color-ink-faint)]">
              The card travels with your name in the print. Whoever it reaches
              is one book further along.
            </p>
          </div>
        </section>

        {/* the loop — every visitor is invited to carry their own */}
        <section
          className="border-y py-16"
          style={{ borderColor: "var(--color-rule)" }}
        >
          <div className="mx-auto max-w-2xl px-5 text-center">
            <h2 className="font-serif text-3xl font-semibold leading-tight sm:text-4xl">
              What did <span className="italic">{book.title}</span> leave in&nbsp;you?
            </h2>
            <p className="mx-auto mt-4 max-w-md font-mono text-xs leading-relaxed text-[var(--color-ink-soft)]">
              {payload.n} carried one line out. There&rsquo;s at least one more in
              there with your name on it.
            </p>
            <Link
              href={`/b/${book.slug}#write`}
              className="mt-8 inline-block rounded-[3px] bg-[var(--color-ink)] px-7 py-4 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-paper)] transition-opacity hover:opacity-85"
            >
              Write your line
            </Link>
          </div>
        </section>

        {others.length > 0 && (
          <section className="mx-auto max-w-6xl px-5 py-16">
            <h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--color-ink-soft)]">
              More lines carried out of {book.title}
            </h3>
            <ul className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((l) => (
                <li key={l.id} className="max-w-[360px]">
                  <LineCard payload={l} id={l.id} asLink className="h-full" />
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
