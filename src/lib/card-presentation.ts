import { bookForPayload, originalName, type Book } from "./books";
import { accessionNo, formatStampDate, formatStampDateBn, isBengali, type LinePayload } from "./line";
import type { EditionText } from "./text-layout";
import { DEFAULT_CARD_TEMPLATE, type CardTemplateId } from "./card-templates";

export type CardScript = "latin" | "bengali";
export const cardScript = (text: string): CardScript => isBengali(text) ? "bengali" : "latin";

/** Content decisions belong here, not in a renderer. A resolved book enriches legacy links.
 * The edition is display-only: `ct` absence means the line predates editions, so the
 * default is resolved for presentation and NEVER written back into the payload. */
export function cardPresentation(payload: LinePayload, resolvedBook?: Book) {
  const book = resolvedBook ?? bookForPayload(payload);
  if (!book) return undefined;
  const title = originalName(book);
  const author = book.authorBn ?? book.author;
  const quoteScript = cardScript(payload.q);
  const year = book.year < 0 ? `${Math.abs(book.year)} BC` : String(book.year);
  return {
    book,
    edition: (payload.ct ?? DEFAULT_CARD_TEMPLATE) as CardTemplateId,
    quote: payload.q,
    name: payload.n,
    title,
    author,
    year,
    byline: `${author} · ${year}`,
    date: quoteScript === "bengali" ? formatStampDateBn(payload.d) : formatStampDate(payload.d),
    quoteScript,
    nameScript: cardScript(payload.n),
    titleScript: cardScript(title),
    authorScript: cardScript(author),
    dateScript: quoteScript,
  };
}

export function editionText(content: NonNullable<ReturnType<typeof cardPresentation>>, id: string): EditionText {
  return {
    quote: content.quote, name: content.name, book: content.title, author: content.author,
    date: content.date, accession: accessionNo(id), language: content.quoteScript,
    quoteScript: content.quoteScript, nameScript: content.nameScript,
    bookScript: content.titleScript, authorScript: content.authorScript, dateScript: content.dateScript,
  };
}

/** The edition's own words, per script. Ported from the approved design board. */
export const EDITION_COPY = {
  "bookplate-v1": { latin: "A reader’s bookplate", bengali: "পাঠকের স্মারক" },
  "poster-v1": { latin: "A line, made yours", bengali: "নিজের করে রাখা কথা" },
  "ticket-v1": { latin: "Reader’s ticket", bengali: "পাঠকের টিকিট" },
} as const satisfies Record<CardTemplateId, Record<CardScript, string>>;

/** Shared furniture copy, keyed by the card's primary (quote) script. */
export const EDITION_SHARED_COPY = {
  afterReading: { latin: "After reading", bengali: "বইটি পড়ে" },
  carriedBy: { latin: "Carried by", bengali: "সঙ্গে রেখেছেন" },
  dated: { latin: "Dated", bengali: "তারিখ" },
  languageName: { latin: "English", bengali: "বাংলা" },
} as const satisfies Record<string, Record<CardScript, string>>;

export const editionCopy = (edition: CardTemplateId, script: CardScript) => EDITION_COPY[edition][script];

/** Type weights for the edition compositions. Each script has the other shipped
 * family as its explicit glyph fallback. */
export const EDITION_WEIGHTS = {
  quote: 500, posterQuote: 600, ticketQuote: 400,
  wordmark: 600, book: 600, author: 400,
  label: 500, name: 600, date: 500,
} as const;

/** Script-safe leading. Bangla keeps 1.5 for names and generic card text;
 * the edition compositions refine quote/metadata leadings on top of this. */
export const cardLeading = (script: CardScript) => script === "bengali" ? 1.5 : 1.4;

/** The two card voices: "text" (quote, book title, wordmark) speaks in the
 * serif book face; "meta" (labels, reader name, author, date, accession,
 * language name) stays in the proportional sans. */
export type CardFontRole = "text" | "meta";

/** "text" leads with Noto Serif Bengali — it covers BOTH Bengali and Latin
 * glyphs — while every script keeps the other shipped sans family as an
 * explicit glyph fallback after it. "meta" is the sans stack alone,
 * script-ordered so the text's own script resolves first. */
export function cardFontFamily(script: CardScript, role: CardFontRole, surface: "dom" | "canvas" | "og") {
  if (role === "meta") {
    if (surface === "dom") {
      const en = "var(--font-manrope)", bn = "var(--font-anek-bangla)";
      return `${script === "bengali" ? `${bn}, ${en}` : `${en}, ${bn}`}, sans-serif`;
    }
    const suffix = surface === "canvas" ? " Export" : "";
    const en = `"Manrope${suffix}"`, bn = `"Anek Bangla${suffix}"`;
    return script === "bengali" ? `${bn}, ${en}` : `${en}, ${bn}`;
  }
  if (surface === "dom") {
    const en = "var(--font-manrope)", bn = "var(--font-anek-bangla)";
    return script === "bengali"
      ? `var(--font-book), ${bn}, ${en}, sans-serif`
      : `var(--font-book), ${en}, ${bn}, sans-serif`;
  }
  const suffix = surface === "canvas" ? " Export" : "";
  const serif = `"Noto Serif Bengali${suffix}"`;
  const en = `"Manrope${suffix}"`, bn = `"Anek Bangla${suffix}"`;
  return script === "bengali" ? `${serif}, ${bn}, ${en}` : `${serif}, ${en}, ${bn}`;
}
