"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { encodeLine, type LinePayload } from "@/lib/line";
import { getBook, type Book } from "@/lib/books";
import { INKS, INK_IDS, type InkId } from "@/lib/inks";
import { addToShelf, getRememberedName, rememberName } from "@/lib/shelf";
import { LINE_MAX, NAME_MAX } from "@/lib/site";
import { LineCard } from "./LineCard";
import { useLocale } from "./LocaleProvider";

export function Composer({ book }: { book: Book }) {
  const router = useRouter();
  const { t } = useLocale();
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [ink, setInk] = useState<InkId>("paper");
  const [errors, setErrors] = useState<{ line?: string; name?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);
  const pending = useRef<AbortController | null>(null);
  useEffect(() => {
    let mounted = true;
    void Promise.resolve().then(() => { if (mounted) setName(getRememberedName()); });
    return () => { mounted = false; pending.current?.abort(); };
  }, []);
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const bookMeta = getBook(book.slug) ? undefined : { title: book.title, author: book.author, year: book.year };
  const preview: LinePayload = {
    v: 1, b: book.slug, q: text.trim().replace(/\s+/g, " ") || t("c.previewLine"),
    n: name.trim().replace(/\s+/g, " ") || t("c.previewName"), s: ink, d: today,
    ...(bookMeta ? { bt: bookMeta.title, ba: bookMeta.author, by: bookMeta.year } : {}),
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pending.current) return;
    const q = text.trim().replace(/\s+/g, " ");
    const n = name.trim().replace(/\s+/g, " ");
    const nextErrors = { line: !q ? t("err.line") : q.length > LINE_MAX ? t("err.length") : undefined,
      name: !n ? t("err.name") : n.length > NAME_MAX ? t("err.nameLength") : undefined };
    setErrors(nextErrors);
    if (nextErrors.line || nextErrors.name) return;
    let carried: { id: string; payload: LinePayload };
    try { carried = encodeLine({ bookSlug: book.slug, text, name, ink, date: today, book: bookMeta }); }
    catch { setErrors({ form: t("err.generic") }); return; }
    const controller = new AbortController();
    pending.current = controller;
    setBusy(true);
    function finish(id: string, payload: LinePayload) {
      if (controller.signal.aborted) return;
      rememberName(n); addToShelf({ id, payload }); router.push(`/l/${id}`);
    }
    try {
      const res = await fetch(`/api/books/${encodeURIComponent(book.slug)}/lines`, {
        method: "POST", signal: controller.signal, headers: { "content-type": "application/json" },
        body: JSON.stringify({ q: text, n: name, s: ink }),
      });
      if (controller.signal.aborted) return;
      if (res.ok) {
        const data = await res.json() as { id: string; payload: LinePayload; live?: boolean };
        if (data.live === true) finish(data.id, data.payload);
        else finish(carried.id, carried.payload);
      } else if (res.status === 502 || res.status === 503) finish(carried.id, carried.payload);
      else setErrors({ form: t(res.status === 429 ? "err.rate" : "err.generic") });
    } catch { if (!controller.signal.aborted) finish(carried.id, carried.payload); }
    finally { if (!controller.signal.aborted) { pending.current = null; setBusy(false); } }
  }

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] lg:gap-12">
      <form onSubmit={submit} noValidate className="panel max-w-xl p-5 sm:p-7">
        <label htmlFor="line" className="block text-sm font-medium">{t("c.1")}</label>
        <textarea id="line" value={text} onChange={(e) => { setText(e.target.value); setErrors((v) => ({ ...v, line: undefined })); }}
          rows={5} required disabled={busy} className="field-input mt-3 resize-y leading-relaxed" placeholder={t("c.1.ph")}
          aria-invalid={!!errors.line} aria-describedby={`line-counter${errors.line ? " line-error" : ""}`} />
        {errors.line && <p id="line-error" role="alert" className="mt-2 text-sm text-[var(--color-stamp)]">{errors.line}</p>}
        <p id="line-counter" className={`mt-2 text-right text-[13px] tabular-nums ${text.length > LINE_MAX ? "text-[var(--color-stamp)]" : "text-[var(--color-ink-soft)]"}`}>{text.length} / {LINE_MAX}</p>
        <div className="mt-6">
          <label htmlFor="name" className="block text-sm font-medium">{t("c.2")}</label>
          <input id="name" type="text" value={name} onChange={(e) => { setName(e.target.value); setErrors((v) => ({ ...v, name: undefined })); }}
            required disabled={busy} maxLength={NAME_MAX} className="field-input mt-3" placeholder={t("c.2.ph")} autoComplete="name"
            aria-invalid={!!errors.name} aria-describedby={errors.name ? "name-error name-note" : "name-note"} />
          {errors.name && <p id="name-error" role="alert" className="mt-2 text-sm text-[var(--color-stamp)]">{errors.name}</p>}
          <p id="name-note" className="mt-2 text-[13px] leading-relaxed text-[var(--color-ink-soft)]">{t("c.2.note")}</p>
        </div>
        <fieldset className="mt-6" disabled={busy}>
          <legend className="text-sm font-medium">{t("c.3")}</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {INK_IDS.map((id) => <label key={id} className="ui-button-secondary cursor-pointer" style={ink === id ? { borderColor: "var(--color-ink)" } : undefined}>
              <input type="radio" name="ink" value={id} checked={ink === id} onChange={() => setInk(id)} className="h-4 w-4 accent-[var(--color-ink)]" />
              <span aria-hidden="true" className="h-3 w-3 rounded-full border" style={{ backgroundColor: INKS[id].bg, borderColor: INKS[id].rule }} />
              {t(`ink.${id}`)}
            </label>)}
          </div>
        </fieldset>
        {errors.form && <p role="alert" className="mt-4 text-sm text-[var(--color-stamp)]">{errors.form}</p>}
        <button type="submit" disabled={busy} className="ui-button mt-7 w-full sm:w-auto">{busy ? t("c.stamping") : t("c.submit")}</button>
        <p className="mt-3 text-[13px] leading-relaxed text-[var(--color-ink-soft)]">{t("c.note")}</p>
      </form>
      <div className="min-w-0 lg:sticky lg:top-[100px]">
        <p className="mb-4 text-sm text-[var(--color-ink-soft)]">{t("c.proof")}</p>
        <div className="mx-auto w-full max-w-[360px]"><LineCard payload={preview} book={book} id="preview-preview" actions={false} /></div>
      </div>
    </div>
  );
}
