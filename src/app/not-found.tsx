import Link from "next/link";
import { Header, Footer } from "@/components/Chrome";
import { T } from "@/components/T";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-5 py-24 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--color-ink-soft)]">
          <T k="nf.kicker" />
        </p>
        <h1 className="mt-6 font-serif text-4xl font-semibold leading-tight sm:text-5xl">
          <T k="nf.title" />
        </h1>
        <p className="mt-5 max-w-md font-mono text-xs leading-relaxed text-[var(--color-ink-soft)]">
          <T k="nf.sub" />
        </p>
        <Link
          href="/#shelf"
          className="mt-9 rounded-[3px] bg-[var(--color-ink)] px-7 py-4 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-paper)] transition-opacity hover:opacity-85"
        >
          <T k="nf.cta" />
        </Link>
      </main>
      <Footer />
    </>
  );
}
