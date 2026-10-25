"use client";

import { useCallback, useEffect, useState } from "react";
import { LineCard } from "./LineCard";
import { usePoll } from "@/lib/use-poll";
import type { LineRecord } from "@/lib/store";
import type { SeedLine } from "@/lib/seeds";

/**
 * The live margin: every line everyone has carried out of this book.
 * Seeds render immediately (also what crawlers see); the API feed merges
 * in on top and keeps polling so new lines appear without a reload.
 */
export function LinesFeed({ slug, seeds }: { slug: string; seeds: SeedLine[] }) {
  const [records, setRecords] = useState<LineRecord[]>(() =>
    seeds.map((s) => ({ id: s.id, payload: s, t: 0 })),
  );
  const [live, setLive] = useState(false);

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/books/${encodeURIComponent(slug)}/lines`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as { lines: LineRecord[]; total: number; live: boolean };
      if (!Array.isArray(data.lines)) return;
      setLive(data.live);
      setRecords((prev) => {
        const byId = new Map(prev.map((r) => [r.id, r]));
        for (const r of data.lines) byId.set(r.id, r);
        const merged = [...byId.values()];
        // keep the page stable: seeds first, then the newest activity
        const seedIds = new Set(seeds.map((s) => s.id));
        return [
          ...merged.filter((r) => seedIds.has(r.id)),
          ...merged.filter((r) => !seedIds.has(r.id)).sort((a, b) => b.t - a.t),
        ];
      });
    } catch {
      /* offline — the seeds stay on the page */
    }
  }, [slug, seeds]);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) poll();
    });
    return () => {
      cancelled = true;
    };
  }, [poll]);

  usePoll(poll, 6000);

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--color-ink-soft)]">
          From the margins
        </h2>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-ink-faint)]">
          {records.length} {records.length === 1 ? "line" : "lines"} ·{" "}
          {live ? (
            <span className="inline-flex items-center gap-1.5 text-[var(--color-stamp)]">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-stamp)]" aria-hidden="true" />
              live
            </span>
          ) : (
            "offline shelf"
          )}
        </p>
      </div>

      {records.length === 0 ? (
        <div className="card-rule mt-8 rounded-[4px] bg-[var(--color-paper-raised)] p-12 text-center">
          <p className="font-serif text-2xl italic">No lines yet.</p>
          <p className="mx-auto mt-3 max-w-md font-mono text-xs leading-relaxed text-[var(--color-ink-soft)]">
            This one&rsquo;s margins are still clean. Yours could be the first
            sentence ever filed here.
          </p>
        </div>
      ) : (
        <ul className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {records.map((r) => (
            <li key={r.id} className="max-w-[360px]">
              <LineCard payload={r.payload} id={r.id} asLink className="h-full" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
