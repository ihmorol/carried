import { bookForPayload, originalName, type Book } from "./books";
import { formatStampDate, formatStampDateBn, isBengali, type LinePayload } from "./line";

export type CardScript = "latin" | "bengali";
export const cardScript = (text: string): CardScript => isBengali(text) ? "bengali" : "latin";

/** Content decisions belong here, not in a renderer. A resolved book enriches legacy links. */
export function cardPresentation(payload: LinePayload, resolvedBook?: Book) {
  const book = resolvedBook ?? bookForPayload(payload);
  if (!book) return undefined;
  const title = originalName(book);
  const author = book.authorBn ?? book.author;
  const quoteScript = cardScript(payload.q);
  const year = book.year < 0 ? `${Math.abs(book.year)} BC` : String(book.year);
  return {
    book,
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

/** Sizes and spacing are in DOM pixels; image surfaces scale this same type system. */
export const CARD_TYPOGRAPHY = { quote: 22, quoteMin: 20, quoteMax: 24, metadata: 12, title: 16, name: 14 } as const;
export const CARD_WEIGHTS = { quote: 500, title: 600, byline: 400, name: 600, date: 500, metadata: 500 } as const;
export const CARD_SPACING = {
  padding: 22, headerGap: 20, quoteGap: 18, provenanceGap: 4, bylineGap: 2,
  signatureGap: 16, signaturePaddingX: 12, signaturePaddingY: 10, signatureColumnGap: 12, signatureNameGap: 2,
} as const;
export const cardLeading = (script: CardScript) => script === "bengali" ? 1.5 : 1.4;

/** The role argument remains for callers; both roles now use proportional sans.
 * Each script has the other shipped family as its explicit glyph fallback. */
export function cardFontFamily(script: CardScript, _role: "serif" | "mono", surface: "dom" | "canvas" | "og") {
  if (surface === "dom") {
    const en = "var(--font-manrope)", bn = "var(--font-anek-bangla)";
    return `${script === "bengali" ? `${bn}, ${en}` : `${en}, ${bn}`}, sans-serif`;
  }
  const suffix = surface === "canvas" ? " Export" : "";
  const en = `"Manrope${suffix}"`, bn = `"Anek Bangla${suffix}"`;
  return script === "bengali" ? `${bn}, ${en}` : `${en}, ${bn}`;
}
