"use client";

import { useCallback, useState } from "react";
import { LineCard } from "./LineCard";
import { usePoll } from "@/lib/use-poll";
import { useLocale } from "./LocaleProvider";
import { numFor } from "@/lib/i18n";
import type { LineRecord } from "@/lib/store";
import type { SeedLine } from "@/lib/seeds";

type FeedRecord = LineRecord & { votes: number };

/** The reader-lines page behind the sidebar's Lines button: the freshest
 * cards across the whole shelf, editorial collection as the offline fallback.
 * Larger than the home ticker and set in the same card grid language. */
export function ReaderLinesFeed({ seeds, limit = 36 }: { seeds: SeedLine[]; limit?: number }) {
  const { t, locale } = useLocale();
  const [lines, setLines] = useState<FeedRecord[]>(() =>
    seeds.slice(0, limit).map((s) => ({ id: s.id, payload: s, t: 0, votes: 0 })));
  const [status, setStatus] = useState<"loading" | "live" | "offline" | "error">("loading");
  const poll = useCallback(async (signal: AbortSignal) => {
    try {
      const res = await fetch(`/api/recent?limit=${limit}`, { cache: "no-store", signal });
      if (!res.ok) throw new Error("offline");
      const data = await res.json() as { lines: FeedRecord[]; live: boolean };
      if (signal.aborted) return;
      if (!Array.isArray(data.lines)) throw new Error("invalid feed");
      setStatus(data.live === true ? "live" : "offline");
      if (data.live === true) setLines(data.lines.slice(0, limit));
    } catch { if (!signal.aborted) setStatus("error"); }
  }, [limit]);
  usePoll(poll, 8000);
  const onVote = useCallback((id: string, votes: number) => {
    setLines((prev) => prev.map((line) => line.id === id ? { ...line, votes } : line));
  }, []);

  return <div className="reader-lines-feed">
    <p className="text-[13px] leading-relaxed text-[var(--color-ink-soft)]" role="status">
      {t(status === "live" ? "feed.live" : status === "loading" ? "feed.editorialLoading" : status === "error" ? "feed.editorialError" : "feed.editorial")}
      {" · "}{t("lines.count", { n: numFor(lines.length, locale), lines: t(lines.length === 1 ? "feed.line" : "feed.lines") })}
    </p>
    <ul className="mt-8 grid items-start gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {lines.map((line) => <li key={line.id}>
        <LineCard payload={line.payload} id={line.id} asLink votes={line.votes} onChange={onVote} className="h-full" />
      </li>)}
    </ul>
  </div>;
}
