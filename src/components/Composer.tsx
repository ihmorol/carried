"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { encodeLine, LineError, type LinePayload } from "@/lib/line";
import { INKS, INK_IDS, type InkId } from "@/lib/inks";
import type { Book } from "@/lib/books";
import { addToShelf, getRememberedName, rememberName } from "@/lib/shelf";
import { LINE_MAX, NAME_MAX } from "@/lib/site";
import { LineCard } from "./LineCard";

/**
 * Write the line, sign it, stamp it. Posts to the live shelf when it's
 * connected; when it isn't, the line travels in its URL instead — either
 * way the reader lands on their card.
 */
export function Composer({ book }: { book: Book }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [ink, setInk] = useState<InkId>("paper");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // hydration-safe read of the remembered name
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) setName(getRememberedName());
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const over = text.length > LINE_MAX;

  const preview = useMemo(
    () => ({
      v: 1 as const,
      b: book.slug,
      q: text.trim() || "The line you carried will sit here, in print.",
      n: name.trim() || "Your name",
      s: ink,
      d: today,
    }),
    [book.slug, text, name, ink, today],
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (busy) return;

    // validate cheaply first so both paths share the same rules
    try {
      encodeLine({ bookSlug: book.slug, text, name, ink, date: today });
    } catch (err) {
      setError(err instanceof LineError ? err.message : "Something smudged. Try again.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(`/api/books/${encodeURIComponent(book.slug)}/lines`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ q: text, n: name, s: ink }),
      });
      if (res.ok) {
        const record = (await res.json()) as { id: string; payload: LinePayload };
        finish(record.id, record.payload);
        return;
      }
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (data?.error && res.status !== 502 && res.status !== 503) {
        setError(data.error);
        setBusy(false);
        return;
      }
      throw new Error("live shelf unreachable");
    } catch {
      // live shelf offline — the URL still carries the whole line
      const { id, payload } = encodeLine({ bookSlug: book.slug, text, name, ink, date: today });
      finish(id, payload);
    }
  }

  function finish(id: string, payload: LinePayload) {
    rememberName(name.trim());
    addToShelf({ id, payload });
    router.push(`/l/${id}`);
  }

  const field =
    "w-full rounded-[3px] border bg-[var(--color-paper-raised)] px-4 py-3 font-mono text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none";

  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_360px] lg:gap-16">
      <form onSubmit={submit} className="max-w-xl">
        <div>
          <label
            htmlFor="line"
            className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-ink-soft)]"
          >
            01 — The line it left in you
          </label>
          <textarea
            id="line"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            required
            className={`${field} mt-3 resize-y leading-relaxed`}
            placeholder="Not a summary. The sentence you'd underline, in your own hand…"
            aria-describedby="line-counter"
          />
          <p
            id="line-counter"
            className={`mt-2 text-right font-mono text-[11px] tabular-nums ${
              over ? "text-[var(--color-stamp)]" : "text-[var(--color-ink-faint)]"
            }`}
            aria-live="polite"
          >
            {text.length} / {LINE_MAX}
          </p>
        </div>

        <div className="mt-8">
          <label
            htmlFor="name"
            className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-ink-soft)]"
          >
            02 — Sign it
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, NAME_MAX))}
            maxLength={NAME_MAX}
            required
            className={`${field} mt-3`}
            placeholder="The name as it should appear in print"
            autoComplete="name"
          />
          <p className="mt-2 font-mono text-[11px] text-[var(--color-ink-faint)]">
            No account. Your name is remembered on this device only.
          </p>
        </div>

        <fieldset className="mt-8">
          <legend className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-ink-soft)]">
            03 — Choose the ink
          </legend>
          <div className="mt-3 flex gap-2" role="radiogroup" aria-label="Card ink">
            {INK_IDS.map((id) => {
              const active = ink === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setInk(id)}
                  className={`flex items-center gap-2 rounded-full border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors ${
                    active
                      ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-paper)]"
                      : "border-[var(--color-rule)] text-[var(--color-ink-soft)] hover:border-[var(--color-ink-soft)]"
                  }`}
                >
                  <span
                    className="inline-block h-3 w-3 rounded-full border"
                    style={{
                      backgroundColor: INKS[id].bg,
                      borderColor: INKS[id].rule,
                    }}
                    aria-hidden="true"
                  />
                  {INKS[id].label}
                </button>
              );
            })}
          </div>
        </fieldset>

        {error && (
          <p
            role="alert"
            className="mt-6 rounded-[3px] border border-[var(--color-stamp)] bg-[var(--color-paper-raised)] px-4 py-3 font-mono text-xs text-[var(--color-stamp)]"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy || over}
          className="mt-10 rounded-[3px] bg-[var(--color-ink)] px-7 py-4 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-paper)] transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? "Stamping…" : "Stamp it & pass it on"}
        </button>
        <p className="mt-4 font-mono text-[11px] text-[var(--color-ink-faint)]">
          No account, ever. Your line joins the public margin under your name.
        </p>
      </form>

      <div className="lg:sticky lg:top-10 lg:self-start">
        <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--color-ink-soft)]">
          Live proof
        </p>
        <div className="w-[320px] max-w-full">
          <LineCard payload={preview} id="preview-preview" />
        </div>
      </div>
    </div>
  );
}
