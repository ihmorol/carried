"use client";

import { useEffect, useState } from "react";
import { addToShelf, consumeShelfSave, type ShelfEntry, type ShelfSaveOutcome } from "@/lib/shelf";
import { useLocale } from "./LocaleProvider";

export function LocalSaveNotice(entry: ShelfEntry) {
  return <SaveReceipt key={entry.id} {...entry} />;
}

function SaveReceipt({ id, payload }: ShelfEntry) {
  const { t } = useLocale();
  const [outcome, setOutcome] = useState<ShelfSaveOutcome | null>(null);
  useEffect(() => {
    let mounted = true;
    // Consume only after mounting, not while prerendering or inside a state
    // initializer which React may invoke twice. No second storage write.
    void Promise.resolve().then(() => {
      if (mounted) setOutcome(consumeShelfSave(id));
    });
    return () => { mounted = false; };
  }, [id]);

  if (!outcome) return null;
  const saved = outcome.status === "saved";
  return <div className="local-save-notice panel p-4" data-save-status={outcome.status}>
    <p role="status" className="text-sm font-medium">{t(saved ? "card.localSaved" : "card.localUnsaved")}</p>
    {!saved && <>
      <p className="mt-2 text-sm text-[var(--color-ink-soft)]">{t("card.localGuidance")}</p>
      <button type="button" className="ui-button-secondary mt-3" onClick={() => setOutcome(addToShelf({ id, payload }))}>{t("card.localRetry")}</button>
    </>}
  </div>;
}
