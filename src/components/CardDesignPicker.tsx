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
    <fieldset className="edition-picker" disabled={disabled}>
      <legend className="text-sm font-medium">{t("c.4")}</legend>
      <div className="edition-picker-options">
        {CARD_TEMPLATES.map((id) => (
          <label key={id} className="edition-picker-option" data-selected={value === id}>
            <input type="radio" name="card-design" value={id} checked={value === id}
              onChange={() => onChange(id)} className="edition-picker-radio" />
            <span aria-hidden="true" className="edition-picker-thumbnail">
              <LineCard payload={{ ...payload, ct: id }} book={book} id={`design-${id}`} actions={false} />
            </span>
            <span className="edition-picker-copy">
              <span className="edition-picker-name">{t(`ct.${id}`)}</span>
              <span className="edition-picker-description">{t(`ct.${id}.desc`)}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
