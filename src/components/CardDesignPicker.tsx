"use client";

import { LineCard } from "./LineCard";
import { CARD_TEMPLATES, type CardTemplateId } from "@/lib/card-templates";
import type { Book } from "@/lib/books";
import type { LinePayload } from "@/lib/line";
import { useLocale } from "./LocaleProvider";

/**
 * The three free editions of a line, as a native radio group with live
 * miniature proofs. The proof inside each label is decoration (aria-hidden);
 * the label's own text — edition name and its one-line description — carries
 * the accessible name, and the native inputs keep the group keyboard-operable.
 */
export function CardDesignPicker({ book, payload, value, onChange, disabled = false }: {
  book: Book;
  payload: LinePayload;
  value: CardTemplateId;
  onChange: (id: CardTemplateId) => void;
  disabled?: boolean;
}) {
  const { t } = useLocale();
  return (
    <fieldset className="mt-6" disabled={disabled}>
      <legend className="text-sm font-medium">{t("c.4")}</legend>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {CARD_TEMPLATES.map((id) => (
          <label key={id}
            className="flex cursor-pointer flex-col gap-2 rounded-[var(--radius-control)] border border-[var(--color-rule)] p-3 transition-colors hover:border-[var(--color-ink-soft)]"
            style={value === id ? { borderColor: "var(--color-ink)" } : undefined}>
            <span className="flex items-center gap-2">
              <input type="radio" name="card-design" value={id} checked={value === id}
                onChange={() => onChange(id)} className="h-4 w-4 accent-[var(--color-ink)]" />
              <span className="text-sm font-medium">{t(`ct.${id}`)}</span>
            </span>
            <span aria-hidden="true" className="pointer-events-none mx-auto block w-full max-w-[128px] select-none">
              <LineCard payload={{ ...payload, ct: id }} book={book} id={`design-${id}`} actions={false} />
            </span>
            <span className="text-[13px] leading-relaxed text-[var(--color-ink-soft)]">{t(`ct.${id}.desc`)}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
