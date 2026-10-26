"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header, Footer } from "@/components/Chrome";
import { LineCard } from "@/components/LineCard";
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
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-12">
        <h1 className="font-serif text-4xl font-semibold sm:text-5xl">My lines</h1>
        <p className="mt-4 max-w-lg font-mono text-xs leading-relaxed text-[var(--color-ink-soft)]">
          The lines you&rsquo;ve carried, kept on this device only. No account
          exists, this shelf is yours alone.
        </p>

        {lines === null ? null : lines.length === 0 ? (
          <div className="card-rule mt-12 rounded-[4px] bg-[var(--color-paper-raised)] p-12 text-center">
            <p className="font-serif text-2xl italic">Your shelf is waiting.</p>
            <p className="mx-auto mt-3 max-w-md font-mono text-xs leading-relaxed text-[var(--color-ink-soft)]">
              Pick a book, write the line it left in you, and it will be
              stamped here, and everywhere you share it.
            </p>
            <Link
              href="/#shelf"
              className="mt-7 inline-block rounded-[3px] bg-[var(--color-ink)] px-6 py-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-paper)] transition-opacity hover:opacity-85"
            >
              Pick a book
            </Link>
          </div>
        ) : (
          <ul className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
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
