import Link from "next/link";
import { Header, Footer } from "@/components/Chrome";
import { T } from "@/components/T";

/** The 404 as an artifact: a catalog card that can't be read, stamped
 * "not in the ledger". Same language as LineCard, no dynamic parts. */
export default function NotFound() {
  return (
    <>
      <Header />
      <main id="main-content" className="page-content flex flex-1 flex-col items-center py-16">
        <div
          className="card-rule w-[420px] max-w-full rounded-[4px] bg-[var(--color-paper-raised)] p-7"
          style={{ transform: "rotate(-1.6deg)" }}
        >
          <div className="flex items-baseline justify-between font-mono text-[9px] font-semibold uppercase tracking-[0.24em] text-[var(--color-ink-soft)]">
            <span>Carried</span>
            <span style={{ textDecoration: "line-through", textDecorationColor: "var(--color-stamp)" }}>
              No. ??????
            </span>
          </div>
          <p className="mt-10 font-serif text-2xl font-medium italic leading-snug text-[var(--color-ink)]">
            <T k="nf.title" />
          </p>
          <div className="mt-12 flex justify-end">
            <span
              className="stamp-ink inline-block rounded-md border-[2.5px] px-4 py-2.5 text-center font-mono text-[10px] font-semibold uppercase leading-relaxed tracking-[0.26em]"
              style={{ transform: "rotate(-5deg)", opacity: 0.9 }}
            >
              <T k="nf.kicker" />
            </span>
          </div>
        </div>

        <p className="mt-10 max-w-md text-center font-mono text-xs leading-relaxed text-[var(--color-ink-soft)]">
          <T k="nf.sub" />
        </p>
        <Link
          href="/#shelf"
          className="btn-press mt-8 rounded-[3px] bg-[var(--color-ink)] px-7 py-4 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-paper)]"
        >
          <T k="nf.cta" />
        </Link>
      </main>
      <Footer />
    </>
  );
}
