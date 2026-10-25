import Link from "next/link";
import { Header, Footer } from "@/components/Chrome";
import { RecentFeed } from "@/components/RecentFeed";
import { LineCard } from "@/components/LineCard";
import { ShelfExplorer } from "@/components/ShelfExplorer";
import { SEED_LINES } from "@/lib/seeds";
import { BOOKS } from "@/lib/books";

const FEATURED = SEED_LINES.find((l) => l.b === "the-little-prince") ?? SEED_LINES[0];

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        {/* ── Hero ─────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-5 pb-16 pt-14 sm:pt-20">
          <div className="grid items-center gap-14 lg:grid-cols-[1.15fr_1fr]">
            <div className="animate-rise-in">
              <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--color-ink-soft)]">
                No account · No app · Just a line
              </p>
              <h1 className="mt-5 font-serif text-5xl font-semibold leading-[1.04] tracking-[-0.01em] sm:text-6xl">
                Every book leaves<br />a line in you.
              </h1>
              <p className="mt-6 max-w-md font-mono text-sm leading-relaxed text-[var(--color-ink-soft)]">
                Not a review. Not a rating. The one sentence you&rsquo;d underline —
                written in your hand, stamped with your name, printed as a card
                worth passing on.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <Link
                  href="#shelf"
                  className="rounded-[3px] bg-[var(--color-ink)] px-7 py-4 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-paper)] transition-opacity hover:opacity-85"
                >
                  Pick a book
                </Link>
                <Link
                  href={`/l/${FEATURED.id}`}
                  className="link-ledger font-mono text-xs uppercase tracking-[0.18em] text-[var(--color-ink)]"
                >
                  See one, first
                </Link>
              </div>
              <p className="mt-10 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-ink-faint)]">
                {BOOKS.length} books on the shelf · {SEED_LINES.length}+ lines carried
              </p>
            </div>

            <div className="relative mx-auto w-[340px] max-w-full lg:justify-self-end">
              <div
                aria-hidden="true"
                className="absolute -left-8 top-6 h-full w-full rounded-[4px] border border-[var(--color-rule)] bg-[var(--color-paper-raised)]"
                style={{ transform: "rotate(-3.5deg)" }}
              />
              <div style={{ transform: "rotate(2deg)" }}>
                <LineCard payload={FEATURED} id={FEATURED.id} size="lg" animateStamp />
              </div>
            </div>
          </div>
        </section>

        {/* ── Fresh from the margins (live) ────────────────── */}
        <section
          className="border-y py-14"
          style={{ borderColor: "var(--color-rule)" }}
          aria-label="Lines readers carried"
        >
          <RecentFeed seeds={SEED_LINES} />
        </section>

        {/* ── How it works ─────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-5 py-20">
          <ol className="grid gap-px overflow-hidden rounded-[4px] border sm:grid-cols-3"
            style={{ borderColor: "var(--color-rule)", background: "var(--color-rule)" }}
          >
            {[
              {
                n: "01",
                t: "Pick a book",
                d: "A hundred shelves-deep classics and modern keepers — or shelve a missing one yourself, no account needed.",
              },
              {
                n: "02",
                t: "Write the one line",
                d: "The sentence you'd underline. Yours, in your own words — twenty-two characters or two hundred.",
              },
              {
                n: "03",
                t: "Stamp it, pass it on",
                d: "Your name goes in the print. Save the card, share the link, and someone new picks up the book. New lines land here live.",
              },
            ].map((s) => (
              <li
                key={s.n}
                className="bg-[var(--color-paper)] px-7 py-9"
                style={{ background: "var(--color-paper)" }}
              >
                <span className="font-serif text-3xl italic text-[var(--color-stamp)]">{s.n}</span>
                <h3 className="mt-4 font-serif text-xl font-semibold">{s.t}</h3>
                <p className="mt-3 font-mono text-xs leading-relaxed text-[var(--color-ink-soft)]">{s.d}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ── The shelf ────────────────────────────────────── */}
        <section id="shelf" className="mx-auto max-w-6xl scroll-mt-8 px-5 pb-8">
          <div className="mb-10 flex items-end justify-between gap-6">
            <div>
              <h2 className="font-serif text-4xl font-semibold">The shelf</h2>
              <p className="mt-3 max-w-lg font-mono text-xs leading-relaxed text-[var(--color-ink-soft)]">
                Find your book — or add the one that&rsquo;s missing. Write the line only you would write.
              </p>
            </div>
            <span className="hidden font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--color-ink-faint)] sm:block">
              Est. by readers
            </span>
          </div>
          <ShelfExplorer />
        </section>

        {/* ── Closing invitation ───────────────────────────── */}
        <section className="mx-auto max-w-6xl px-5 py-24 text-center">
          <p className="mx-auto max-w-2xl font-serif text-3xl font-medium italic leading-snug">
            &ldquo;Some books you read. Some books read you — and leave a line behind.&rdquo;
          </p>
          <Link
            href="#shelf"
            className="mt-9 inline-block rounded-[3px] bg-[var(--color-stamp)] px-7 py-4 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-paper-raised)] transition-opacity hover:opacity-85"
          >
            Carry yours out
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
