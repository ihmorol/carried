"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { bookForPayload, originalName } from "@/lib/books";
import { isBengali } from "@/lib/line";
import { LineCard } from "./LineCard";
import { usePoll } from "@/lib/use-poll";
import { useLocale } from "./LocaleProvider";
import type { LineRecord } from "@/lib/store";
import type { SeedLine } from "@/lib/seeds";

type FeedRecord = LineRecord & { votes: number };

type RecentFeedProps = { seeds: SeedLine[]; variant?: "cards" | "list" };

/** Live reflections retain an explicit editorial fallback in either presentation. */
export function RecentFeed({ seeds, variant = "cards" }: RecentFeedProps) {
  const { t, locale } = useLocale();
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
  const dateFormat = new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

  return <div className={`recent-feed recent-feed--${variant}`}>
    <div className="recent-feed-heading">
      <h2>{t(variant === "list" ? "feed.readerLines" : "feed.fresh")}</h2>
      <p role="status">{t(status === "live" ? "feed.live" : status === "loading" ? "feed.editorialLoading" : status === "error" ? "feed.editorialError" : "feed.editorial")}</p>
    </div>
    {lines.length ? variant === "list" ? <ul className="recent-lines-list">
      {lines.map((line) => {
        const book = bookForPayload(line.payload);
        const date = new Date(`${line.payload.d}T00:00:00Z`);
        return <li key={line.id}>
          <Link href={`/l/${line.id}`} className="recent-line-link" aria-label={t("feed.openLine", { n: line.payload.n })}>
            <p className="recent-line-quote" lang={isBengali(line.payload.q) ? "bn" : "en"}>{line.payload.q}</p>
            <div className="recent-line-meta">
              <span className="recent-line-name" lang={isBengali(line.payload.n) ? "bn" : "en"}>{line.payload.n}</span>
              {book && <><span aria-hidden="true">·</span><span className="recent-line-book" lang={isBengali(originalName(book)) ? "bn" : "en"}>{originalName(book)}</span></>}
              {!Number.isNaN(date.getTime()) && <time dateTime={line.payload.d}>{dateFormat.format(date)}</time>}
            </div>
          </Link>
        </li>;
      })}
    </ul> : <ul className="recent-lines-grid grid items-start gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {lines.map((line) => <li key={line.id}><LineCard payload={line.payload} id={line.id} votes={line.votes} asLink onChange={onVote} className="h-full" /></li>)}
    </ul> : <p className="panel p-6 text-sm">{t("feed.empty.title")}</p>}
  </div>;
}
