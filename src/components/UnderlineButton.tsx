"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { beginVote, cancelVote, finishVote, getServerVoteState, getVoteState, getVoterId, subscribeVotes, updateVoteCount } from "@/lib/voter";
import type { Ink } from "@/lib/inks";
import { useLocale } from "./LocaleProvider";

export function UnderlineButton({ lineId, initialVotes = 0, initialVoted = false, onChange, ink }: {
  lineId: string; initialVotes?: number; initialVoted?: boolean; ink?: Ink;
  onChange?: (lineId: string, votes: number, voted: boolean) => void;
}) {
  const { t } = useLocale();
  const state = useSyncExternalStore(subscribeVotes, () => getVoteState(lineId), getServerVoteState);
  const [error, setError] = useState(false);
  const request = useRef<AbortController | null>(null);
  useEffect(() => { updateVoteCount(lineId, initialVotes); }, [lineId, initialVotes]);
  useEffect(() => () => { if (request.current) { request.current.abort(); cancelVote(lineId); } }, [lineId]);
  const votes = state.votes ?? initialVotes;
  // A persisted choice is a preference, never evidence for a live count.
  const voted = state.voted ?? initialVoted;
  async function toggle(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation();
    if (!beginVote(lineId)) return;
    setError(false);
    const controller = new AbortController(); request.current = controller;
    try {
      const res = await fetch(`/api/lines/${encodeURIComponent(lineId)}/vote`, {
        method: "POST", signal: controller.signal, headers: { "content-type": "application/json" }, body: JSON.stringify({ voterId: getVoterId() }),
      });
      if (!res.ok) throw new Error("vote failed");
      const data = await res.json() as { votes: number; voted: boolean };
      if (!Number.isFinite(data.votes) || data.votes < 0 || typeof data.voted !== "boolean") throw new Error("invalid vote");
      if (controller.signal.aborted) return;
      finishVote(lineId, data.votes, data.voted); onChange?.(lineId, data.votes, data.voted);
    } catch { if (!controller.signal.aborted) { cancelVote(lineId); setError(true); } }
    finally { if (request.current === controller) request.current = null; }
  }
  return <span className="inline-flex flex-col items-start gap-1">
    <button type="button" onClick={toggle} aria-pressed={voted} aria-busy={state.busy} disabled={state.busy}
      aria-label={`${t("vote.underline")} · ${votes}`}
      className="inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 font-mono text-[13px] font-medium disabled:opacity-60"
      style={{ color: voted ? ink?.stamp ?? "var(--color-stamp)" : ink?.text ?? "inherit", borderColor: voted ? ink?.stamp ?? "var(--color-stamp)" : ink?.rule ?? "var(--color-rule)", background: "transparent" }}>
      <span aria-hidden="true">⁂</span>{t(voted ? "vote.underlined" : "vote.underline")}<span className="tabular-nums">· {votes}</span>
    </button>
    {error && <span role="status" className="text-[13px]" style={{ color: ink?.stamp ?? "var(--color-stamp)" }}>{t("vote.error")}</span>}
  </span>;
}
