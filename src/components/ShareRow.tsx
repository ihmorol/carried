"use client";

import { useEffect, useRef, useState } from "react";
import { bookForPayload } from "@/lib/books";
import { accessionNo, type LinePayload } from "@/lib/line";
import { downloadLineCard, lineCardBlob } from "@/lib/canvas";
import { SITE_URL } from "@/lib/site";
import { useLocale } from "./LocaleProvider";

export function ShareRow({ payload, id }: { payload: LinePayload; id: string }) {
  return <CardShare key={id} payload={payload} id={id} />;
}
function CardShare({ payload, id }: { payload: LinePayload; id: string }) {
  const { t } = useLocale();
  const [origin, setOrigin] = useState(SITE_URL);
  const url = `${origin.replace(/\/$/, "")}/l/${id}`;
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState<"save" | "share" | "copy" | null>(null);
  const [canShare, setCanShare] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fallback, setFallback] = useState(false);
  const mounted = useRef(false);
  const working = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const title = bookForPayload(payload)?.title ?? t("share.book");
  useEffect(() => {
    mounted.current = true;
    void Promise.resolve().then(() => {
      if (!mounted.current) return;
      setOrigin(window.location.origin); setCanShare(typeof navigator.share === "function");
    });
    return () => { mounted.current = false; clearTimeout(timer.current); };
  }, []);
  function begin(action: "save" | "share" | "copy") {
    if (working.current) return false;
    working.current = true; setBusy(action); setError(null); return true;
  }
  function end() { working.current = false; if (mounted.current) setBusy(null); }
  async function copy() {
    if (!begin("copy")) return;
    try {
      await navigator.clipboard.writeText(url);
      if (!mounted.current) return;
      setCopied(true); setFallback(false);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => { if (mounted.current) setCopied(false); }, 2000);
    } catch { if (mounted.current) { setError(t("share.copyError")); setFallback(true); } }
    finally { end(); }
  }
  async function save() {
    if (!begin("save")) return;
    try { await downloadLineCard(payload, id); }
    catch { if (mounted.current) setError(t("share.saveError")); }
    finally { end(); }
  }
  async function nativeShare() {
    if (!begin("share")) return;
    const text = t("share.text", { q: payload.q, title, n: payload.n });
    try {
      // Image generation is optional; a failed print still allows URL sharing.
      let file: File | null = null;
      try {
        const blob = await lineCardBlob(payload, id);
        if (blob) file = new File([blob], `carried-${accessionNo(id).toLowerCase()}.png`, { type: "image/png" });
      } catch { /* Share readable text and the link instead. */ }
      if (!mounted.current) return;
      if (file && navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], text, url });
      else await navigator.share({ title, text, url });
    } catch (err) {
      if (mounted.current && !(err && typeof err === "object" && "name" in err && err.name === "AbortError")) {
        setError(t("share.shareError")); setFallback(true);
      }
    } finally { end(); }
  }
  const shareText = encodeURIComponent(t("share.text", { q: payload.q, title, n: payload.n }));
  return <div>
    <div className="flex flex-wrap items-center gap-2.5">
      <button type="button" onClick={save} disabled={busy !== null} className="ui-button">{t(busy === "save" ? "share.saving" : "share.save")}</button>
      <button type="button" onClick={copy} disabled={busy !== null} aria-live="polite" className="ui-button-secondary">{t(copied ? "share.copied" : "share.copy")}</button>
      {canShare && <button type="button" onClick={nativeShare} disabled={busy !== null} className="ui-button-secondary">{t(busy === "share" ? "share.sharing" : "share.share")}</button>}
      <a href={`https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" className="share-destination">{t("share.x")}</a>
      <a href={`https://wa.me/?text=${shareText}%20${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" className="share-destination">{t("share.wa")}</a>
    </div>
    {error && <p role="alert" className="mt-3 text-sm text-[var(--color-stamp)]">{error}</p>}
    {fallback && <div className="mt-3"><label htmlFor={`copy-${id}`} className="mb-2 block text-sm">{t("share.fallback")}</label>
      <input id={`copy-${id}`} type="text" readOnly value={url} onFocus={(e) => e.currentTarget.select()} className="field-input" />
    </div>}
  </div>;
}
