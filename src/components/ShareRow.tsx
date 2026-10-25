"use client";

import { useEffect, useState } from "react";
import { getBook } from "@/lib/books";
import { accessionNo, type LinePayload } from "@/lib/line";
import { downloadLineCard, lineCardBlob } from "@/lib/canvas";
import { SITE_URL } from "@/lib/site";
import { useLocale } from "./LocaleProvider";

/**
 * The pass-it-on row: copy link, native share (with the rendered PNG when
 * the platform allows it), X and WhatsApp. Every share is an invitation,
 * the URL lands on this same card, whose footer asks the visitor to write theirs.
 */
export function ShareRow({ payload, id }: { payload: LinePayload; id: string }) {
  const { t } = useLocale();
  const [url, setUrl] = useState(`${SITE_URL}/l/${id}`);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [canShare, setCanShare] = useState(false);

  const book = getBook(payload.b);
  const title = book?.title ?? "a book";

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      setUrl(window.location.href);
      setCanShare(!!navigator.share);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked, user can still select the address bar */
    }
  }

  async function save() {
    if (saving) return;
    setSaving(true);
    try {
      await downloadLineCard(payload, id);
    } finally {
      setSaving(false);
    }
  }

  async function nativeShare() {
    const text = `“${payload.q}”, carried out of ${title}, by ${payload.n}`;
    try {
      const blob = await lineCardBlob(payload, id);
      const file = blob ? new File([blob], `carried-${accessionNo(id).toLowerCase()}.png`, { type: "image/png" }) : null;
      if (file && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text, url });
        return;
      }
      await navigator.share({ title, text, url });
    } catch {
      /* user cancelled */
    }
  }

  const shareText = encodeURIComponent(`“${payload.q}”, a line carried out of “${title}”`);

  const btn =
    "rounded-[3px] border px-5 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors";

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <button
        type="button"
        onClick={save}
        disabled={saving}
        className={`${btn} border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-paper)] hover:opacity-85 disabled:opacity-50`}
      >
        {saving ? t("share.saving") : t("share.save")}
      </button>
      <button
        type="button"
        onClick={copy}
        aria-live="polite"
        className={`${btn} border-[var(--color-rule)] text-[var(--color-ink)] hover:border-[var(--color-ink)]`}
      >
        {copied ? t("share.copied") : t("share.copy")}
      </button>
      {canShare && (
        <button
          type="button"
          onClick={nativeShare}
          className={`${btn} border-[var(--color-rule)] text-[var(--color-ink)] hover:border-[var(--color-ink)]`}
        >
          {t("share.share")}
        </button>
      )}
      <a
        href={`https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        className={`${btn} border-[var(--color-rule)] text-[var(--color-ink)] hover:border-[var(--color-ink)]`}
      >
        {t("share.x")}
      </a>
      <a
        href={`https://wa.me/?text=${shareText}%20${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        className={`${btn} border-[var(--color-rule)] text-[var(--color-ink)] hover:border-[var(--color-ink)]`}
      >
        {t("share.wa")}
      </a>
    </div>
  );
}
