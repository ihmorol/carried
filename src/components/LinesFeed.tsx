"use client";

import { useCallback, useState } from "react";
import { LineCard } from "./LineCard";
import { usePoll } from "@/lib/use-poll";
import { useLocale } from "./LocaleProvider";
import { numFor } from "@/lib/i18n";
import type { LineRecord } from "@/lib/store";
import type { SeedLine } from "@/lib/seeds";

type FeedRecord = LineRecord & { votes: number };
function fromSeeds(seeds: SeedLine[]): FeedRecord[] {
  return seeds.map((s) => ({ id: s.id, payload: s, t: Date.parse(`${s.d}T12:00:00Z`) || 0, votes: 0 }));
}
function sortRecords(records: FeedRecord[]) {
  return [...records].sort((a, b) => b.votes - a.votes || b.t - a.t);
}

/** A keyed inner feed prevents a previous book's margin flashing on navigation. */
export function LinesFeed({ slug, seeds }: { slug: string; seeds: SeedLine[] }) {
  return <BookFeed key={slug} slug={slug} seeds={seeds} />;
}
function BookFeed({ slug, seeds }: { slug: string; seeds: SeedLine[] }) {
  const { t, locale } = useLocale();
  const [records, setRecords] = useState(() => fromSeeds(seeds));
  const [status, setStatus] = useState<"loading" | "live" | "offline" | "error">("loading");
  const poll = useCallback(async (signal: AbortSignal) => {
    try {
      const res = await fetch(`/api/books/${encodeURIComponent(slug)}/lines`, { cache: "no-store", signal });
      if (!res.ok) throw new Error("offline");
      const data = await res.json() as { lines: FeedRecord[]; live: boolean };
      if (signal.aborted) return;
      if (!Array.isArray(data.lines)) throw new Error("invalid feed");
      setStatus(data.live === true ? "live" : "offline");
      setRecords((prev) => {
        const byId = new Map(prev.map((r) => [r.id, r]));
        for (const record of data.lines) if (record.payload?.b === slug) byId.set(record.id, { ...record, votes: record.votes ?? 0 });
        return sortRecords([...byId.values()]);
      });
    } catch { if (!signal.aborted) setStatus("error"); }
  }, [slug]);
  usePoll(poll, 6000);
  const onVote = useCallback((lineId: string, votes: number) => {
    setRecords((prev) => sortRecords(prev.map((r) => r.id === lineId ? { ...r, votes } : r)));
  }, []);

  return <div>
    <div className="flex flex-wrap items-baseline justify-between gap-4">
      <h2 className="section-title">{t("feed.margins")}</h2>
      <p className="text-[13px] text-[var(--color-ink-soft)]" role="status">{t("feed.count", {
        n: numFor(records.length, locale), lines: t(records.length === 1 ? "feed.line" : "feed.lines"),
        sort: t("feed.sorted"), state: t(status === "live" ? "feed.liveShort" : status === "loading" ? "feed.loading" : status === "error" ? "feed.error" : "feed.editorial"),
      })}</p>
    </div>
    {records.length === 0 ? <div className="panel mt-8 p-8"><p className="font-serif text-2xl">{t("feed.empty.title")}</p><p className="mt-3 text-sm text-[var(--color-ink-soft)]">{t("feed.empty.sub")}</p></div>
      : <ul className="reveal-list mt-8 grid items-start gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {records.map((record) => <li key={record.id}><LineCard payload={record.payload} id={record.id} votes={record.votes} asLink onChange={onVote} className="h-full" /></li>)}
      </ul>}
  </div>;
}
