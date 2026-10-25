"use client";

import { useCallback, useEffect, useState } from "react";
import { LineCard } from "./LineCard";
import { usePoll } from "@/lib/use-poll";
import type { LineRecord } from "@/lib/store";
import type { SeedLine } from "@/lib/seeds";

type FeedRecord = LineRecord & { votes: number };

function seedTime(d: string): number {
  const t = new Date(`${d}T12:00:00Z`).getTime();
  return Number.isFinite(t) ? t : 0;
}

/** Most-underlined first; newest breaks ties. */
function sortRecords(records: FeedRecord[]): FeedRecord[] {
  return [...records].sort((a, b) => b.votes - a.votes || b.t - a.t);
}

/**
 * The live margin: every line everyone has carried out of this book,
 * sorted by underline count — the best rise, the rest follows in time
 * order. Seeds render immediately; the API feed merges in and keeps
 * polling so new lines and votes appear without a reload.
 */
export function LinesFeed({ slug, seeds }: { slug: string; seeds: SeedLine[] }) {
  const [records, setRecords] = useState<FeedRecord[]>(() =>
    seeds.map((s) => ({ id: s.id, payload: s, t: seedTime(s.d), votes: 0 })),
  );
  const [live, setLive] = useState(false);

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/books/${encodeURIComponent(slug)}/lines`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as {
        lines: FeedRecord[];
        total: number;
        live: boolean;
      };
      if (!Array.isArray(data.lines)) return;
      setLive(data.live);
      setRecords((prev) => {
        const byId = new Map(prev.map((r) => [r.id, r]));
        for (const r of data.lines) byId.set(r.id, r);
        return sortRecords([...byId.values()]);
      });
    } catch {
      /* offline — the seeds stay on the page */
    }
  }, [slug]);

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

  const onVote = useCallback((lineId: string, votes: number) => {
    setRecords((prev) =>
      sortRecords(prev.map((r) => (r.id === lineId ? { ...r, votes } : r))),
    );
  }, []);

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--color-ink-soft)]">
          From the margins
        </h2>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-ink-faint)]">
          {records.length} {records.length === 1 ? "line" : "lines"} · sorted by underlines ·{" "}
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
              <LineCard
                payload={r.payload}
                id={r.id}
                votes={r.votes}
                asLink
                onChange={onVote}
                className="h-full"
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
