"use client";

import { Suspense, useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { decodeLine, encodeLine, LINE_ID_MAX, validateLinePayload, type LinePayload } from "@/lib/line";
import { inspectDraftInput } from "@/lib/draft-input";
import { DEFAULT_CARD_TEMPLATE, type CardTemplateId } from "@/lib/card-templates";
import { getBook, type Book } from "@/lib/books";
import { INKS, INK_IDS, type InkId } from "@/lib/inks";
import { addToShelf, getRememberedName, rememberName, rememberShelfSave } from "@/lib/shelf";
import { LINE_MAX } from "@/lib/site";
import { LineCard } from "./LineCard";
import { CardDesignPicker } from "./CardDesignPicker";
import { ProofBoundary } from "./ProofBoundary";
import { TiltCard } from "./TiltCard";
import { useLocale } from "./LocaleProvider";

type ComposerProps = {
  book: Book;
  /** Resolved and validated by the card route; legacy ?line= still works. */
  initialPayload?: LinePayload;
  sourceId?: string;
  creationMode?: "public" | "link-only";
};

/** Search params suspend during prerender, so the whole composer sits
 * behind its own Suspense boundary (Next.js requirement for static pages). */
export function Composer(props: ComposerProps) {
  return (
    <Suspense fallback={null}>
      <ComposerForm key={`${props.book.slug}:${props.sourceId ?? "new"}`} {...props} />
    </Suspense>
  );
}

function ComposerForm({ book, initialPayload, sourceId, creationMode = "public" }: ComposerProps) {
  const router = useRouter();
  const params = useSearchParams();
  const { t } = useLocale();
  const formId = useId();
  const proofId = `${formId}-proof`;
  // The resolved card route takes precedence over untrusted query prefills.
  // A different book's payload never fills this form or claims its source id.
  const prefill = useMemo<LinePayload | null>(() => {
    try {
      const raw = params.get("line");
      const payload = initialPayload ? validateLinePayload(initialPayload) : raw ? decodeLine(raw) : null;
      return payload?.b === book.slug ? payload : null;
    } catch { return null; }
  }, [initialPayload, params, book.slug]);
  const prefillId = useMemo(() => {
    const raw = initialPayload ? sourceId : params.get("id");
    return prefill && raw && raw.length <= LINE_ID_MAX && /^[a-zA-Z0-9_-]+$/.test(raw) ? raw : undefined;
  }, [initialPayload, sourceId, prefill, params]);
  const [text, setText] = useState(() => prefill?.q ?? "");
  const [name, setName] = useState(() => prefill?.n ?? "");
  const nameChosen = useRef(!!prefill);
  const [ink, setInk] = useState<InkId>(() => prefill?.s ?? "paper");
  const [template, setTemplate] = useState<CardTemplateId>(() => prefill?.ct ?? DEFAULT_CARD_TEMPLATE);
  const [stampKey, setStampKey] = useState(0);
  const [errors, setErrors] = useState<{ line?: string; name?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);
  const pending = useRef<AbortController | null>(null);
  useEffect(() => {
    let mounted = true;
    void Promise.resolve().then(() => { if (mounted && !nameChosen.current) setName((current) => current || getRememberedName()); });
    return () => { mounted = false; pending.current?.abort(); };
  }, []);
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const bookMeta = getBook(book.slug) ? undefined : { title: book.title, author: book.author, year: book.year };
  const draft = inspectDraftInput(text, name);
  const lineError = draft.lineIssue === "too-long" ? t("err.length") : errors.line;
  const nameError = draft.nameIssue === "too-long" ? t("err.nameLength") : errors.name;
  const preview: LinePayload = {
    v: 1, b: book.slug, q: draft.proofLine ?? t("c.previewLine"),
    n: draft.proofName ?? t("c.previewName"), s: ink, d: today,
    ...(bookMeta ? { bt: bookMeta.title, ba: bookMeta.author, by: bookMeta.year } : {}),
    ct: template,
  };
  const proofKey = JSON.stringify(preview);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pending.current) return;
    const { n, lineIssue, nameIssue } = inspectDraftInput(text, name);
    const nextErrors = { line: lineIssue === "empty" ? t("err.line") : lineIssue === "too-long" ? t("err.length") : undefined,
      name: nameIssue === "empty" ? t("err.name") : nameIssue === "too-long" ? t("err.nameLength") : undefined };
    setErrors(nextErrors);
    if (nextErrors.line || nextErrors.name) return;
    let carried: { id: string; payload: LinePayload };
    // New copies use the creation date, never a restyled source's date or id.
    try { carried = encodeLine({ bookSlug: book.slug, text, name, ink, book: bookMeta, template }); }
    catch { setErrors({ form: t("err.generic") }); return; }
    const controller = new AbortController();
    pending.current = controller;
    setBusy(true);
    function finish(id: string, payload: LinePayload) {
      if (controller.signal.aborted) return;
      const saved = addToShelf({ id, payload });
      rememberShelfSave(id, saved);
      rememberName(n);
      setStampKey((k) => k + 1);
      router.push(`/l/${id}`);
    }
    try {
      if (creationMode === "link-only") { finish(carried.id, carried.payload); return; }
      const res = await fetch(`/api/books/${encodeURIComponent(book.slug)}/lines`, {
        method: "POST", signal: controller.signal, headers: { "content-type": "application/json" },
        body: JSON.stringify({ q: text, n: name, s: ink, ct: template }),
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
    <div className="composer-workspace">
      <form id={formId} onSubmit={submit} noValidate className="composer-form panel p-5 sm:p-7">
        <a href={`#${proofId}`} className="composer-proof-link link-ledger mb-4 inline-flex min-h-11 items-center" onClick={() => document.getElementById(proofId)?.focus()}>{t("c.viewProof")}</a>
        <label htmlFor="line" className="block text-sm font-medium">{t("c.1")}</label>
        <textarea id="line" value={text} onChange={(e) => { setText(e.target.value); setErrors((v) => ({ ...v, line: undefined })); }}
          rows={5} required disabled={busy} className="field-input mt-3 resize-y leading-relaxed" placeholder={t("c.1.ph")}
          aria-invalid={!!lineError} aria-describedby={`line-counter${lineError ? " line-error" : ""}`} />
        {lineError && <p id="line-error" role="alert" className="mt-2 text-sm text-[var(--color-stamp)]">{lineError}</p>}
        <p id="line-counter" className={`mt-2 text-right text-[13px] tabular-nums ${draft.lineIssue === "too-long" ? "text-[var(--color-stamp)]" : "text-[var(--color-ink-soft)]"}`}>{draft.lineLength} / {LINE_MAX}</p>
        <div className="mt-6">
          <label htmlFor="name" className="block text-sm font-medium">{t("c.2")}</label>
          <input id="name" type="text" value={name} onChange={(e) => { nameChosen.current = true; setName(e.target.value); setErrors((v) => ({ ...v, name: undefined })); }}
            required disabled={busy} className="field-input mt-3" placeholder={t("c.2.ph")} autoComplete="name"
            aria-invalid={!!nameError} aria-describedby={nameError ? "name-error name-note" : "name-note"} />
          {nameError && <p id="name-error" role="alert" className="mt-2 text-sm text-[var(--color-stamp)]">{nameError}</p>}
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
        <ProofBoundary resetKey={proofKey} message={t("c.proofUnavailable")} retryLabel={t("c.proofRetry")}>
          <CardDesignPicker book={book} payload={preview} value={template} onChange={setTemplate} disabled={busy} />
        </ProofBoundary>
      </form>
      <section id={proofId} className="composer-proof min-w-0" tabIndex={-1} aria-labelledby={`${proofId}-heading`}>
        <h3 id={`${proofId}-heading`} className="mb-4 text-sm text-[var(--color-ink-soft)]">{t("c.proof")}</h3>
        {(draft.lineIssue === "too-long" || draft.nameIssue === "too-long") && <p className="composer-proof-note mb-4 text-sm text-[var(--color-ink-soft)]">{t("c.proofInvalid")}</p>}
        <ProofBoundary resetKey={proofKey} message={t("c.proofUnavailable")} retryLabel={t("c.proofRetry")}>
          <div key={stampKey} className="mx-auto w-full max-w-[360px] animate-stamp-in">
            <TiltCard max={4}><LineCard payload={preview} book={book} id={prefillId ?? "preview-preview"} actions={false} /></TiltCard>
          </div>
        </ProofBoundary>
      </section>
      <div className="composer-submit">
        {errors.form && <p role="alert" className="mb-4 text-sm text-[var(--color-stamp)]">{errors.form}</p>}
        <button type="submit" form={formId} disabled={busy} className="ui-button w-full sm:w-auto">{busy ? t("c.stamping") : t("c.submit")}</button>
        <p className="mt-3 text-[13px] leading-relaxed text-[var(--color-ink-soft)]">{t(creationMode === "link-only" ? "c.linkOnly" : "c.note")}</p>
      </div>
    </div>
  );
}
