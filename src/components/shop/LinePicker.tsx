"use client";
import Link from "next/link";
import { useId } from "react";
import { LineCard } from "@/components/LineCard";
import { CARD_TEMPLATES, DEFAULT_CARD_TEMPLATE } from "@/lib/card-templates";
import { INKS, INK_IDS } from "@/lib/inks";
import { bookForPayload } from "@/lib/books";
import { useShopCopy } from "@/lib/commerce/copy";
import type { Selection } from "@/lib/commerce/personalization";

export function InkSelector({ selection, onChange }: { selection: Selection; onChange: (next: Selection) => void }) {
  const { c } = useShopCopy();
  return <fieldset className="shop-fieldset">
    <legend>{c("ink")}</legend>
    <div className="shop-ink-options">
      {INK_IDS.map(ink => <label key={ink} className={`shop-ink-option${selection.payload.s === ink ? " is-selected" : ""}`}>
        <input type="radio" name="shop-ink" value={ink} checked={selection.payload.s === ink} onChange={() => onChange({ ...selection, payload: { ...selection.payload, s: ink } })} />
        <span className="shop-ink-dot" style={{ backgroundColor: INKS[ink].bg, borderColor: INKS[ink].rule }} aria-hidden />{c(ink)}
      </label>)}
    </div>
  </fieldset>;
}
export function DesignSelector({ selection, onChange }: { selection: Selection; onChange: (next: Selection) => void }) {
  const { c } = useShopCopy();
  // A payload without an edition predates designs; it displays as the house
  // edition, and choosing one here writes an explicit ct into this
  // personalization copy. The source id stays: only the words re-mint it.
  const current = selection.payload.ct ?? DEFAULT_CARD_TEMPLATE;
  return <fieldset className="shop-fieldset">
    <legend>{c("design")}</legend>
    <div className="shop-ink-options">
      {CARD_TEMPLATES.map(template => <label key={template} className={`shop-ink-option${current === template ? " is-selected" : ""}`}>
        <input type="radio" name="shop-design" value={template} checked={current === template} onChange={() => onChange({ ...selection, payload: { ...selection.payload, ct: template } })} />
        {c(template)}
      </label>)}
    </div>
  </fieldset>;
}
export function LinePicker({ selection, saved, example, onChange, showCard = true }: {
  selection: Selection; saved: Selection[]; example: Selection; onChange: (next: Selection) => void; showCard?: boolean;
}) {
  const { c } = useShopCopy();
  const hintId = useId();
  const choices = saved.some(line => line.sourceId === selection.sourceId) || selection.isExample ? saved : [selection, ...saved];
  return <section className="shop-line-picker">
    <h2 className="section-title">{c("selected")}</h2>
    <p className={`shop-source-label${selection.isExample ? " is-example" : ""}`}>{c(selection.isExample ? "example" : "own")}</p>
    <label className="shop-field">
      <span>{c("choose")}</span>
      <select className="field-input" aria-describedby={hintId} value={selection.isExample ? "example" : selection.sourceId} onChange={event => {
        const next = event.target.value === "example" ? example : choices.find(line => line.sourceId === event.target.value);
        if (next) onChange(next);
      }}>
        <option value="example">{c("example")}</option>
        {choices.map(line => <option key={line.sourceId} value={line.sourceId}>{bookForPayload(line.payload)?.title} · {line.payload.n} · {line.payload.q.slice(0, 48)}</option>)}
      </select>
    </label>
    <p id={hintId} className="shop-note">{c(saved.length ? "chooseHint" : "noLines")}</p>
    <InkSelector selection={selection} onChange={onChange} />
    <DesignSelector selection={selection} onChange={onChange} />
    <Link className="shop-text-link" href="/books">{c("write")}</Link>
    {showCard && <LineCard payload={selection.payload} id={selection.sourceId} actions={false} className="shop-sidebar-card" />}
  </section>;
}
