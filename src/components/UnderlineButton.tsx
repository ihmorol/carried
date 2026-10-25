"use client";

import { useState } from "react";
import { getVoterId } from "@/lib/voter";
import { useLocale } from "./LocaleProvider";

/**
 * The vote: "underline this line." One toggle per anonymous reader,
 * and the count decides which lines rise to the top of the margin.
 */
export function UnderlineButton({
  lineId,
  initialVotes = 0,
  initialVoted = false,
  onChange,
}: {
  lineId: string;
  initialVotes?: number;
  initialVoted?: boolean;
  onChange?: (lineId: string, votes: number, voted: boolean) => void;
}) {
  const { t } = useLocale();
  const [votes, setVotes] = useState(initialVotes);
  const [voted, setVoted] = useState(initialVoted);
  const [busy, setBusy] = useState(false);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    const optimisticVoted = !voted;
    setVoted(optimisticVoted);
    setVotes((v) => Math.max(0, v + (optimisticVoted ? 1 : -1)));
    try {
      const res = await fetch(`/api/lines/${encodeURIComponent(lineId)}/vote`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ voterId: getVoterId() }),
      });
      if (res.ok) {
        const data = (await res.json()) as { votes: number; voted: boolean };
        setVotes(data.votes);
        setVoted(data.voted);
        onChange?.(lineId, data.votes, data.voted);
      } else {
        setVoted(!optimisticVoted);
        setVotes((v) => Math.max(0, v + (optimisticVoted ? -1 : 1)));
      }
    } catch {
      setVoted(!optimisticVoted);
      setVotes((v) => Math.max(0, v + (optimisticVoted ? -1 : 1)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={voted}
      aria-label={voted ? `${t("vote.underlined")} · ${votes}` : `${t("vote.underline")} · ${votes}`}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.16em] transition-colors ${
        voted
          ? "border-[var(--color-stamp)] bg-[var(--color-stamp)] text-[var(--color-paper-raised)]"
          : "border-[var(--color-rule)] text-[var(--color-ink-soft)] hover:border-[var(--color-stamp)] hover:text-[var(--color-stamp)]"
      } disabled:opacity-60`}
      disabled={busy}
    >
      <span aria-hidden="true">⁂</span>
      {voted ? t("vote.underlined") : t("vote.underline")}
      <span className="tabular-nums opacity-80">· {votes}</span>
    </button>
  );
}
