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

/** Noto is a glyph companion to the two house faces, never an unrelated display voice. */
export function cardFontFamily(script: CardScript, role: "serif" | "mono", surface: "dom" | "canvas" | "og") {
  const bengali = role === "serif" ? "Noto Serif Bengali" : "Noto Sans Bengali";
  const latin = role === "serif" ? "Fraunces" : "Plex";
  if (surface === "dom") {
    const bn = role === "serif" ? "var(--font-noto-serif-bengali)" : "var(--font-noto-sans-bengali)";
    const en = role === "serif" ? "var(--font-fraunces)" : "var(--font-plex)";
    return `${script === "bengali" ? `${bn}, ${en}` : `${en}, ${bn}`}, ${role === "serif" ? "serif" : "monospace"}`;
  }
  const suffix = surface === "canvas" ? " Export" : "";
  return script === "bengali"
    ? `"${bengali}${suffix}", "${latin}${suffix}"`
    : `"${latin}${suffix}", "${bengali}${suffix}"`;
}
