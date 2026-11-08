"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header, Footer } from "@/components/Chrome";
import { LineCard } from "@/components/LineCard";
import { T } from "@/components/T";
import { getShelf } from "@/lib/shelf";
import { tiltFor } from "@/lib/tilt";
import type { ShelfEntry } from "@/lib/shelf";

export default function ShelfPage() {
  const [lines, setLines] = useState<ShelfEntry[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) setLines(getShelf());
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-14">
        <h1 className="display-lg"><T k="mine.title" /></h1>
        <p className="mt-5 max-w-lg font-mono text-xs leading-relaxed text-[var(--color-ink-soft)]">
          <T k="mine.sub" />
        </p>

        {lines === null ? null : lines.length === 0 ? (
          <div className="card-rule mt-14 rounded-[4px] bg-[var(--color-paper-raised)] p-12">
            <p className="font-serif text-2xl italic"><T k="mine.empty.title" /></p>
            <p className="mt-3 max-w-md font-mono text-xs leading-relaxed text-[var(--color-ink-soft)]">
              <T k="mine.empty.sub" />
            </p>
            <Link
              href="/#shelf"
              className="btn-press mt-8 inline-block rounded-[3px] bg-[var(--color-ink)] px-6 py-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-paper)]"
            >
              <T k="mine.empty.cta" />
            </Link>
          </div>
        ) : (
          <ul className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {lines.map((e, i) => (
              <li
                key={e.id}
                className="toss max-w-[360px] animate-rise-in"
                style={
                  {
                    "--tilt": `${tiltFor(e.id)}deg`,
                    animationDelay: `${Math.min(i, 8) * 55}ms`,
                  } as React.CSSProperties
                }
              >
                <LineCard payload={e.payload} id={e.id} asLink className="h-full" />
              </li>
            ))}
          </ul>
        )}
      </main>
      <Footer />
    </>
  );
}
