"use client";

import { useSyncExternalStore, type ComponentProps } from "react";
import { getServerVoteState, getVoteState, subscribeVotes } from "@/lib/voter";
import { translate, type Locale } from "@/lib/i18n";
import { UnderlineButton } from "./UnderlineButton";
import { useLocale } from "./LocaleProvider";

/** A small client island around the actions, not the card artwork. Both the
 * button and summary read the same accepted/in-flight voter snapshot. */
export function LineActions({ lineId, initialVotes = 0, language, ...buttonProps }: ComponentProps<typeof UnderlineButton> & { language?: Locale }) {
  const { locale } = useLocale();
  const state = useSyncExternalStore(subscribeVotes, () => getVoteState(lineId), getServerVoteState);
  const votes = state.votes ?? initialVotes;
  const labelLanguage = language ?? locale;
  const key = votes === 0 ? "vote.none" : votes === 1 ? "vote.once" : "vote.many";
  return <div className="edition-actions">
    <UnderlineButton {...buttonProps} lineId={lineId} initialVotes={initialVotes} />
    <span lang={labelLanguage} aria-live="polite">{translate(labelLanguage, key, { n: votes })}</span>
  </div>;
}
