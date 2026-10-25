import Link from "next/link";
import { Header, Footer } from "@/components/Chrome";
import { RecentFeed } from "@/components/RecentFeed";
import { LineCard } from "@/components/LineCard";
import { ShelfExplorer } from "@/components/ShelfExplorer";
import { HeroSearch } from "@/components/HeroSearch";
import { T } from "@/components/T";
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
                <T k="hero.kicker" />
              </p>
              <h1 className="mt-5 font-serif text-5xl font-semibold leading-[1.04] tracking-[-0.01em] sm:text-6xl">
                <T k="hero.h1a" />
                <span className="italic text-[var(--color-stamp)]"><T k="hero.h1b" /></span>
                <T k="hero.h1c" />
              </h1>
              <p className="mt-6 max-w-md font-mono text-sm leading-relaxed text-[var(--color-ink-soft)]">
                <T k="hero.sub" />
              </p>

              <div className="mt-8">
                <HeroSearch />
              </div>

              <p className="mt-10 flex flex-wrap gap-x-6 gap-y-1 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-ink-faint)]">
                <span><strong className="font-semibold text-[var(--color-ink)]">{BOOKS.length}</strong> <T k="hero.stat.books" /></span>
                <span><strong className="font-semibold text-[var(--color-ink)]">{SEED_LINES.length}+</strong> <T k="hero.stat.lines" /></span>
                <span className="text-[var(--color-stamp)]"><T k="hero.stat.next" /></span>
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
                <T k="hero.today" v={{ n: FEATURED.n }} />
              </p>
              <p className="mt-3 text-center">
                <Link
                  href={`/b/${FEATURED.b}#write`}
                  className="link-ledger font-mono text-xs uppercase tracking-[0.18em] text-[var(--color-ink)]"
                >
                  <T k="hero.loop" />
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
              <T k="band.title" />
            </h2>
            <ol className="mt-12 grid gap-10 sm:grid-cols-3">
              {[
                { n: "01", t: "band.1.t", d: "band.1.d" },
                { n: "02", t: "band.2.t", d: "band.2.d" },
                { n: "03", t: "band.3.t", d: "band.3.d" },
              ].map((s) => (
                <li key={s.n}>
                  <span className="font-serif text-5xl italic text-[var(--color-stamp-soft)]">{s.n}</span>
                  <h3 className="mt-4 font-serif text-2xl font-semibold"><T k={s.t} /></h3>
                  <p className="soft mt-3 font-mono text-xs leading-relaxed"><T k={s.d} /></p>
                </li>
              ))}
            </ol>
            <p className="soft mt-14 border-t border-[#3a332a] pt-6 font-mono text-[11px] uppercase tracking-[0.2em]">
              <T k="band.note" />
            </p>
          </div>
        </section>

        {/* ── The shelf ────────────────────────────────────── */}
        <section id="shelf" className="mx-auto max-w-6xl scroll-mt-8 px-5 pb-8 pt-20">
          <div className="mb-10 flex items-end justify-between gap-6">
            <div>
              <h2 className="font-serif text-4xl font-semibold"><T k="shelf.title" /></h2>
              <p className="mt-3 max-w-lg font-mono text-xs leading-relaxed text-[var(--color-ink-soft)]">
                <T k="shelf.sub" />
              </p>
            </div>
            <span className="hidden font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--color-ink-faint)] sm:block">
              <T k="shelf.est" />
            </span>
          </div>
          <ShelfExplorer />
        </section>

        {/* ── Closing invitation ───────────────────────────── */}
        <section className="mx-auto max-w-6xl px-5 py-24 text-center">
          <p className="mx-auto max-w-2xl font-serif text-3xl font-medium italic leading-snug sm:text-4xl">
            &ldquo;<T k="hero.kicker" />&rdquo;
          </p>
          <Link
            href="#shelf"
            className="btn-press mt-10 inline-block rounded-[3px] bg-[var(--color-stamp)] px-8 py-4 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-paper-raised)] hover:opacity-85"
          >
            <T k="nav.write" />
          </Link>
          <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-ink-faint)]">
            <T k="c.note" />
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
