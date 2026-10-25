import Link from "next/link";
import { Header, Footer } from "@/components/Chrome";
import { RecentFeed } from "@/components/RecentFeed";
import { LineCard } from "@/components/LineCard";
import { ShelfExplorer } from "@/components/ShelfExplorer";
import { HeroSearch } from "@/components/HeroSearch";
import { marqueeLines, lineOfTheDay, SEED_LINES } from "@/lib/seeds";
import { BOOKS } from "@/lib/books";

// The "front page" pick rotates daily — revalidate keeps it fresh
// without giving up static speed. The pick itself is computed per render.
export const revalidate = 3600;

export default function Home() {
  const FEATURED = lineOfTheDay();
  return (
    <>
      <Header />
      <main className="flex-1">
        {/* ── Hero ─────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-5 pb-20 pt-14 sm:pt-20">
          <div className="grid items-center gap-14 lg:grid-cols-[1.15fr_1fr]">
            <div className="animate-rise-in">
              <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--color-ink-soft)]">
                Every book leaves a line in you
              </p>
              <h1 className="mt-5 font-serif text-5xl font-semibold leading-[1.04] tracking-[-0.01em] sm:text-6xl">
                What did your favorite book leave in{" "}
                <span className="italic text-[var(--color-stamp)]">you</span>?
              </h1>
              <p className="mt-6 max-w-md font-mono text-sm leading-relaxed text-[var(--color-ink-soft)]">
                One sentence. Your name in the print. A card worth passing on —
                no account, no app, nothing between you and the margin.
              </p>

              <div className="mt-8">
                <HeroSearch />
              </div>

              <p className="mt-10 flex flex-wrap gap-x-6 gap-y-1 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-ink-faint)]">
                <span><strong className="font-semibold text-[var(--color-ink)]">{BOOKS.length}</strong> books</span>
                <span><strong className="font-semibold text-[var(--color-ink)]">{SEED_LINES.length}+</strong> lines in the margins</span>
                <span className="text-[var(--color-stamp)]">yours is next</span>
              </p>
            </div>

            <div className="relative mx-auto w-[340px] max-w-full lg:justify-self-end">
              <div
                aria-hidden="true"
                className="absolute -left-9 top-8 h-full w-full rounded-[4px] border border-[var(--color-rule)] bg-[var(--color-paper-raised)]"
                style={{ transform: "rotate(-4.5deg)" }}
              />
              <div
                aria-hidden="true"
                className="absolute -right-4 top-2 h-full w-full rounded-[4px] border border-[var(--color-rule)] bg-[var(--color-paper-raised)] opacity-70"
                style={{ transform: "rotate(5deg)" }}
              />
              <div className="relative" style={{ transform: "rotate(2deg)" }}>
                <LineCard payload={FEATURED} id={FEATURED.id} size="lg" animateStamp />
              </div>
              <p className="mt-5 text-center font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-ink-faint)]">
                Today&rsquo;s front page — carried by {FEATURED.n}
              </p>
              <p className="mt-3 text-center">
                <Link
                  href={`/b/${FEATURED.b}#write`}
                  className="link-ledger font-mono text-xs uppercase tracking-[0.18em] text-[var(--color-ink)]"
                >
                  What would <span className="italic text-[var(--color-stamp)]">your</span> line say? →
                </Link>
              </p>
            </div>
          </div>
        </section>

        {/* ── Fresh from the margins (live) ────────────────── */}
        <section
          className="border-y py-14"
          style={{ borderColor: "var(--color-rule)" }}
          aria-label="Lines readers carried"
        >
          <RecentFeed seeds={marqueeLines()} />
        </section>

        {/* ── How it works — ink band ──────────────────────── */}
        <section className="band-ink py-20">
          <div className="mx-auto max-w-6xl px-5">
            <h2 className="font-serif text-3xl font-semibold sm:text-4xl">
              Three steps. No accounts.
            </h2>
            <ol className="mt-12 grid gap-10 sm:grid-cols-3">
              {[
                {
                  n: "01",
                  t: "Pick a book",
                  d: "A hundred shelves-deep classics and modern keepers — or shelve a missing one yourself.",
                },
                {
                  n: "02",
                  t: "Write the one line",
                  d: "The sentence you'd underline. Yours, in your own words — short or all two hundred characters of it.",
                },
                {
                  n: "03",
                  t: "Stamp it, pass it on",
                  d: "Your name in the print. Save the card, share the link — new lines land here live.",
                },
              ].map((s) => (
                <li key={s.n}>
                  <span className="font-serif text-5xl italic text-[var(--color-stamp-soft)]">{s.n}</span>
                  <h3 className="mt-4 font-serif text-2xl font-semibold">{s.t}</h3>
                  <p className="soft mt-3 font-mono text-xs leading-relaxed">{s.d}</p>
                </li>
              ))}
            </ol>
            <p className="soft mt-14 border-t border-[#3a332a] pt-6 font-mono text-[11px] uppercase tracking-[0.2em]">
              Your line joins the public margin under your name — the way a margin should be.
            </p>
          </div>
        </section>

        {/* ── The shelf ────────────────────────────────────── */}
        <section id="shelf" className="mx-auto max-w-6xl scroll-mt-8 px-5 pb-8 pt-20">
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
          <p className="mx-auto max-w-2xl font-serif text-3xl font-medium italic leading-snug sm:text-4xl">
            &ldquo;Some books you read. Some books read you — and leave a{" "}
            <span className="text-[var(--color-stamp)]">line</span> behind.&rdquo;
          </p>
          <Link
            href="#shelf"
            className="btn-press mt-10 inline-block rounded-[3px] bg-[var(--color-stamp)] px-8 py-4 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-paper-raised)] hover:opacity-85"
          >
            Stamp your name on one
          </Link>
          <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-ink-faint)]">
            Free, forever, no account — the margin is open.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
