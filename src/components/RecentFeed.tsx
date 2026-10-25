"use client";

import { useCallback, useEffect, useState } from "react";
import { LineCard } from "./LineCard";
import { usePoll } from "@/lib/use-poll";
import { useLocale } from "./LocaleProvider";
import type { LineRecord } from "@/lib/store";
import type { SeedLine } from "@/lib/seeds";

type FeedRecord = LineRecord & { votes: number };

/**
 * The home ticker, live: starts with the editorial seeds, then the global
 * recent-lines feed flows in and keeps refreshing. Duplicated track for a
 * seamless loop; pauses on hover.
 */
export function RecentFeed({ seeds }: { seeds: SeedLine[] }) {
  const { t } = useLocale();
  const [lines, setLines] = useState<FeedRecord[]>(() =>
    seeds.map((s) => ({ id: s.id, payload: s, t: 0, votes: 0 })),
  );
  const [live, setLive] = useState(false);

  const poll = useCallback(async () => {
    try {
      const res = await fetch("/api/recent?limit=24", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { lines: FeedRecord[]; live: boolean };
      if (!Array.isArray(data.lines) || data.lines.length === 0) return;
      setLive(data.live);
      setLines(data.lines);
    } catch {
      /* offline, seeds keep ticking */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) poll();
    });
    return () => {
      cancelled = true;
    };
  }, [poll]);

  usePoll(poll, 8000);

  const track = (ariaHidden: boolean) => (
    <ul className="flex shrink-0 gap-7 pr-7" aria-hidden={ariaHidden || undefined}>
      {lines.map((r) => (
        <li key={r.id} className="w-[290px] shrink-0">
          <LineCard payload={r.payload} id={r.id} votes={r.votes} asLink className="h-full" />
        </li>
      ))}
    </ul>
  );

  return (
    <div>
      <div className="mx-auto mb-8 flex max-w-6xl items-baseline justify-between px-5">
        <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--color-ink-soft)]">
          {t("feed.fresh")}
        </h2>
        {live && (
          <p className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-stamp)]">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-stamp)]" aria-hidden="true" />
            {t("feed.live")}
          </p>
        )}
      </div>
      <div className="marquee-mask overflow-hidden py-2">
        <div className="marquee-track flex w-max animate-marquee">
          {track(false)}
          {track(true)}
        </div>
      </div>
    </div>
  );
}
