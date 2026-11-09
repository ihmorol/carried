"use client";

import { useCallback, useState } from "react";
import { LineCard } from "./LineCard";
import { usePoll } from "@/lib/use-poll";
import { useLocale } from "./LocaleProvider";
import type { LineRecord } from "@/lib/store";
import type { SeedLine } from "@/lib/seeds";

type FeedRecord = LineRecord & { votes: number };

/** Supplemental reading, three static cards rather than a duplicated ticker. */
export function RecentFeed({ seeds }: { seeds: SeedLine[] }) {
  const { t } = useLocale();
  const [lines, setLines] = useState<FeedRecord[]>(() => seeds.slice(0, 3).map((s) => ({ id: s.id, payload: s, t: 0, votes: 0 })));
  const [status, setStatus] = useState<"loading" | "live" | "offline" | "error">("loading");
  const poll = useCallback(async (signal: AbortSignal) => {
    try {
      const res = await fetch("/api/recent?limit=3", { cache: "no-store", signal });
      if (!res.ok) throw new Error("offline");
      const data = await res.json() as { lines: FeedRecord[]; live: boolean };
      if (signal.aborted) return;
      if (!Array.isArray(data.lines)) throw new Error("invalid feed");
      setStatus(data.live === true ? "live" : "offline");
      if (data.live === true) setLines(data.lines.slice(0, 3));
      // Stateless responses are editorial, not just-carried reader activity.
    } catch { if (!signal.aborted) setStatus("error"); }
  }, []);
  usePoll(poll, 8000);
  const onVote = useCallback((id: string, votes: number) => {
    setLines((prev) => prev.map((line) => line.id === id ? { ...line, votes } : line));
  }, []);
  return <div>
    <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
      <h2 className="section-title">{t("feed.fresh")}</h2>
      <p role="status" className="text-[13px] text-[var(--color-ink-soft)]">{t(status === "live" ? "feed.live" : status === "loading" ? "feed.editorialLoading" : status === "error" ? "feed.editorialError" : "feed.editorial")}</p>
    </div>
    {lines.length ? <ul className="recent-lines-grid grid items-start gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {lines.map((line) => <li key={line.id}><LineCard payload={line.payload} id={line.id} votes={line.votes} asLink onChange={onVote} className="h-full" /></li>)}
    </ul> : <p className="panel p-6 text-sm">{t("feed.empty.title")}</p>}
  </div>;
}
