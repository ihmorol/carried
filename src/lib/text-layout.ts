import type { CardScript } from "./card-presentation";
import type { CardTemplateId } from "./card-templates";

export type TextMeasure = (text: string, fontSize: number) => number;
export type TextFit = { lines: string[]; fontSize: number; lineHeight: number; height: number };

/** Intl keeps Bengali conjuncts, combining marks, and emoji sequences intact. */
export function graphemes(text: string): string[] {
  const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
  return Array.from(segmenter.segment(text), (part) => part.segment);
}

/** Prefer word boundaries; split an overlong word only at grapheme boundaries.
 * Whitespace is retained, so joining the result reproduces the full input.
 */
export function wrapText(text: string, width: number, measure: (text: string) => number): string[] {
  if (width <= 0) throw new RangeError("Text width must be positive");
  const lines: string[] = [];
  let line = "";
  const flush = () => { if (line) { lines.push(line); line = ""; } };
  for (const token of text.match(/\S+|\s+/gu) ?? []) {
    if (measure(line + token) <= width && !token.includes("\n")) {
      line += token;
      continue;
    }
    if (!/^\s+$/u.test(token)) flush();
    for (const cluster of graphemes(token)) {
      if (cluster === "\n" || cluster === "\r\n") {
        line += cluster;
        flush();
      } else {
        if (line && measure(line + cluster) > width) flush();
        line += cluster;
      }
    }
  }
  flush();
  return lines.length ? lines : [""];
}

/** Largest whole-pixel type that fits BOTH dimensions; never ellipsizes.
 * For invalid out-of-bound content we fail rather than silently crop it.
 */
export function fitText(text: string, options: {
  width: number; height: number; maxFontSize: number; minFontSize: number;
  leading: number; measure: TextMeasure;
}): TextFit {
  for (let fontSize = options.maxFontSize; fontSize >= options.minFontSize; fontSize--) {
    const lines = wrapText(text, options.width, (value) => options.measure(value, fontSize));
    const lineHeight = fontSize * options.leading;
    const height = lines.length * lineHeight;
    if (height <= options.height && lines.every((line) => options.measure(line, fontSize) <= options.width)) {
      return { lines, fontSize, lineHeight, height };
    }
  }
  throw new RangeError("Full text does not fit the reserved card region");
}

/** Conservative proportional-sans metrics for SSR, bounded against the
 * shipped Manrope/Anek Bangla 400–600 advances. Bengali spacing marks DO
 * have width; only nonspacing marks and joiners can be omitted. Fitting
 * roles ("quote"/"book") measure the serif text voice instead: every serif
 * unit below is conservatively WIDER than its sans unit (never narrower),
 * because this estimator is the shared source of truth for line breaks on
 * DOM and canvas — overestimating only breaks a line earlier, while
 * underestimating would overflow. Canvas uses the loaded faces' shaped
 * metrics instead. */
export type TextFitRole = "quote" | "book";
export function estimateTextWidth(text: string, fontSize: number, role?: TextFitRole): number {
  const serif = role !== undefined;
  let units = 0;
  for (const char of Array.from(text)) {
    if (/[\u0980-\u09ff]/u.test(char)) {
      if (/[\u09cb\u09cc\u09e2\u09e3]/u.test(char)) units += serif ? 0.84 : 0.8;
      else if (/[\u0982\u0983]/u.test(char)) units += serif ? 0.58 : 0.55;
      else if (/\p{Mc}/u.test(char)) units += serif ? 0.38 : 0.36;
      else if (!/\p{Mark}/u.test(char)) units += char === "আ" ? (serif ? 1.36 : 1.3) : char === "ঞ" ? (serif ? 1.11 : 1.06) : serif ? 1.05 : 1;
    } else if (/\p{Mark}|[\u200c\u200d\r\n]/u.test(char)) continue;
    else if (char === "\t") units += serif ? 2.85 : 2.72;
    else if (/\s/u.test(char)) units += serif ? 0.36 : 0.34;
    else if (/[MW@%&#]/u.test(char)) units += serif ? 1.08 : 1.02;
    else if (/[mw]/u.test(char)) units += serif ? 0.97 : 0.92;
    else if (/[A-Z]/u.test(char)) units += serif ? 0.85 : 0.8;
    else if (/[il.,'!:;|]/u.test(char)) units += serif ? 0.42 : 0.38;
    else if (/[a-z0-9]/u.test(char)) units += serif ? 0.73 : 0.68;
    else units += serif ? 1.2 : 1.15;
  }
  return units * fontSize;
}

export type CardRegion = { x: number; y: number; width: number; height: number };

/* ------------------------------------------------------------------ */
/* Edition artwork: the approved 4:5 compositions at 360 × 450 print  */
/* space. The DOM expresses these as cqw units; the PNG export scales */
/* by exactly 3 to 1080 × 1350.                                       */
/* ------------------------------------------------------------------ */

export const EDITION_ARTWORK = { width: 360, height: 450, scale: 3 } as const;

/** Print-space pixels → container-query width for the DOM artwork. */
export const editionCqw = (pixels: number): string => `${(pixels / (EDITION_ARTWORK.width / 100)).toFixed(6)}cqw`;

export type EditionText = {
  quote: string; name: string; book: string; author: string; byline: string; date: string; accession: string;
  /** The card's primary language (the quote's script): labels and root lang. */
  language: CardScript;
  quoteScript: CardScript; nameScript: CardScript; bookScript: CardScript; authorScript: CardScript; dateScript: CardScript;
};

type EditionRegion = { width: number; height: number; size: number; min: number };
type EditionRole = "quote" | "name" | "book" | "author" | "date";
export type EditionMeasure = (role: EditionRole, text: string, size: number) => number;

/** Print-space floors stay intact in the compact layout: quote 14px,
 * name 9px, and metadata 8px. The author fit includes the publication year. */
const EDITION_TYPE_REGIONS: Record<CardTemplateId, Record<Exclude<EditionRole, "date">, EditionRegion>> = {
  "bookplate-v1": {
    quote: { width: 296, height: 210, size: 28, min: 14 },
    name: { width: 296, height: 40, size: 20, min: 9 },
    book: { width: 296, height: 56, size: 17, min: 9 },
    author: { width: 296, height: 48, size: 12, min: 9 },
  },
  "poster-v1": {
    quote: { width: 304, height: 210, size: 34, min: 14 },
    name: { width: 304, height: 40, size: 22, min: 9 },
    book: { width: 304, height: 56, size: 17, min: 9 },
    author: { width: 304, height: 48, size: 12, min: 9 },
  },
  "ticket-v1": {
    quote: { width: 300, height: 197, size: 26, min: 14 },
    name: { width: 78, height: 54, size: 20, min: 9 },
    book: { width: 196, height: 76, size: 14, min: 8 },
    author: { width: 196, height: 52, size: 11, min: 8 },
  },
};

/** Approved edition leadings: Bangla names keep 1.5; quotes tighten by edition. */
export function editionLeading(language: CardScript, edition: CardTemplateId, role: "quote" | "name" | "metadata"): number {
  if (language === "bengali") return role === "name" ? 1.5 : role === "quote" ? 1.45 : 1.4;
  if (role === "quote") return edition === "poster-v1" ? 1.12 : 1.27;
  return role === "name" ? 1.15 : 1.35;
}

export type EditionLayout = {
  dense: boolean;
  quote: TextFit; name: TextFit; book: TextFit; author: TextFit;
  quoteLeading: number; nameLeading: number; bookLeading: number; authorLeading: number;
  /** All positions are print pixels, including actual painted line boxes. */
  quoteTop: number; quoteInset: number; quoteHeight: number; quoteY: number;
  header: { top: number; inset: number; wordmarkSize: number; wordmarkLeading: number; accessionTop: number; accessionSize: number;
    /** Hairline under the wordmark/accession row: the open Bookplate shares
     * the Ticket's header furniture; dense mode and other editions opt out. */
    ruleTop: number; rule: boolean };
  credit: { top: number; inset: number; width: number; labelHeight: number; labelSize: number; gap: number; height: number };
  ownership: { top: number; height: number; nameHeight: number; nameWidth: number; gap: number };
  bandTop: number;
  ticket: { captionTop: number; datelineTop: number };
  nameBreaks: boolean;
};

function editionFit(role: EditionRole, measure: EditionMeasure, raw: string, region: EditionRegion, lineHeight: number, breakAnywhere = false): TextFit {
  const normalized = raw.replace(/\s+/gu, " ");
  // The emergency layout permits grapheme-safe breaks instead of unreadable type.
  // Join words for measuring that wrapping policy only; never rewrite rendered text.
  const measured = breakAnywhere ? normalized.replace(/ /gu, "\u2060") : normalized;
  return fitText(measured, {
    width: region.width,
    height: region.height,
    maxFontSize: region.size,
    minFontSize: region.min,
    leading: lineHeight,
    measure: (value, size) => (breakAnywhere ? measure(role, value.replace(/\u2060/gu, " "), size) : measure(role, value, size)),
  });
}

/** Fit the title AND the complete author/year within the actual ticket stub.
 * Compact labels give the 90/60-character extrema space without lowering type floors. */
function fitTicketCredit(measure: EditionMeasure, text: EditionText, leading: { book: number; author: number }) {
  const region = EDITION_TYPE_REGIONS["ticket-v1"];
  for (let size = region.book.size; size >= region.book.min; size--) {
    try {
      const book = editionFit("book", measure, text.book, { ...region.book, size, min: size }, leading.book);
      const authorSize = Math.min(size, region.author.size);
      const author = editionFit("author", measure, text.byline, { ...region.author, size: authorSize, min: authorSize }, leading.author);
      const labelSize = size === region.book.min ? 8 : 9.5;
      const labelHeight = labelSize * 1.3;
      const gap = size === region.book.min ? 1 : 2;
      if (labelHeight + gap + book.height + author.height <= 113) return { book, author, labelSize, labelHeight, gap };
    } catch (error) {
      if (!(error instanceof RangeError)) throw error;
    }
  }
  throw new RangeError("Full title, author and year do not fit the ticket stub");
}

/** Full-content compositions, not independently positioned text regions.
 * Credit and ownership are measured FIRST; the remaining space belongs to the
 * quote. Every density reserves at least 12px between quote and credit. A short
 * Bookplate is an open, top-aligned inscription with its provenance immediately
 * after it, rather than a centered certificate with a large internal void. */
export function layoutEditionArtwork(text: EditionText, edition: CardTemplateId, measure?: EditionMeasure): EditionLayout {
  const regions = EDITION_TYPE_REGIONS[edition];
  const m: EditionMeasure = measure ?? ((role, value, size) =>
    estimateTextWidth(value, size, role === "quote" || role === "book" ? role : undefined));
  const quoteLeading = editionLeading(text.quoteScript, edition, "quote");
  const nameLeading = editionLeading(text.nameScript, edition, "name");
  const bookLeading = editionLeading(text.bookScript, edition, "metadata");
  const authorLeading = editionLeading(text.authorScript, edition, "metadata");
  const ticket = edition === "ticket-v1";
  const poster = edition === "poster-v1";
  const quoteSize = Math.min(regions.quote.size, text.quote.length > 140 ? 24 : text.quote.length > 70 ? 26 : regions.quote.size);

  const compose = (dense: boolean): EditionLayout => {
    const quoteInset = dense ? ticket ? 12 : 8 : (EDITION_ARTWORK.width - regions.quote.width) / 2;
    const width = EDITION_ARTWORK.width - quoteInset * 2;
    const nameRegion = dense && !ticket ? { ...regions.name, width, height: 28, size: 18 } : regions.name;
    let name: TextFit;
    let nameBreaks = false;
    try {
      name = editionFit("name", m, text.name, nameRegion, nameLeading);
    } catch (error) {
      if (!(error instanceof RangeError)) throw error;
      nameBreaks = true;
      name = editionFit("name", m, text.name, nameRegion, nameLeading, true);
    }

    const creditFit = ticket ? fitTicketCredit(m, text, { book: bookLeading, author: authorLeading }) : {
      book: editionFit("book", m, text.book, dense ? { width, height: 36, size: 8, min: 8 } : regions.book, bookLeading, dense),
      author: editionFit("author", m, text.byline, dense ? { width, height: 36, size: 8, min: 8 } : regions.author, authorLeading, dense),
      labelSize: dense ? 8 : 11,
      labelHeight: (dense ? 8 : 11) * 1.3,
      gap: dense ? 1 : 3,
    };
    const { book, author, labelSize, labelHeight, gap } = creditFit;
    const creditHeight = labelHeight + gap + book.height + author.height;
    const ownershipGap = dense ? 1 : 3;
    const nameHeight = ticket ? name.height : Math.max(dense ? 16 : 30, name.height);
    const ownershipHeight = 14.3 + nameHeight + 14 + (poster ? 0 : 1.5) + ownershipGap * (poster ? 2 : 3);
    const bandPadding = dense ? 5 : 18;
    const bandTop = poster ? EDITION_ARTWORK.height - ownershipHeight - bandPadding * 2 : 333;
    const ownershipTop = poster ? bandTop + bandPadding : EDITION_ARTWORK.height - (dense ? 8 : 24) - ownershipHeight;
    const creditBottom = poster ? bandTop - 12 : ownershipTop - (dense ? 12 : 20);
    const clearance = dense ? 12 : 16;
    let quoteTop = dense ? ticket ? 40 : 36 : ticket ? 92 : poster ? 82 : 96;
    const available = ticket ? dense ? 264 : regions.quote.height
      : Math.min(dense ? Infinity : regions.quote.height, creditBottom - creditHeight - clearance - quoteTop);
    const quote = editionFit("quote", m, text.quote, { ...regions.quote, width, height: available, size: quoteSize }, quoteLeading, dense);
    // Portrait adapters consume precisely these line boxes, never a second fit.
    const quoteY = quoteTop + (dense || ticket ? Math.max(0, (available - quote.height) / 2) : 0);
    const quoteHeight = dense || ticket ? available : quote.height;
    if (!dense && !ticket) quoteTop = quoteY;
    const creditTop = ticket ? 333 + (117 - creditHeight) / 2
      : dense ? creditBottom - creditHeight : quoteY + quote.height + clearance;
    const headerTop = dense ? ticket ? 12 : 10 : ticket ? 22 : poster ? 24 : 28;
    const wordmarkSize = dense ? 16 : poster ? 18 : 17;
    const wordmarkLeading = dense ? 1.1 : 1.2;

    return {
      dense, quote, name, book, author,
      quoteLeading, nameLeading, bookLeading, authorLeading,
      quoteTop, quoteInset, quoteHeight, quoteY,
      header: { top: headerTop, inset: quoteInset, wordmarkSize, wordmarkLeading,
        accessionTop: headerTop + wordmarkSize * wordmarkLeading - 10 * 1.3, accessionSize: 10,
        ruleTop: headerTop + wordmarkSize * wordmarkLeading + 8, rule: !dense && edition === "bookplate-v1" },
      credit: { top: creditTop, inset: ticket ? 27 : quoteInset, width: ticket ? 196 : width,
        labelSize, labelHeight, gap, height: creditHeight },
      ownership: { top: ownershipTop, height: ownershipHeight, nameHeight, nameWidth: nameRegion.width, gap: ownershipGap },
      bandTop,
      ticket: { captionTop: dense ? 316 : 63, datelineTop: dense ? 316 : 305 },
      nameBreaks,
    };
  };

  try { return compose(false); }
  catch (error) {
    if (!(error instanceof RangeError)) throw error;
    return compose(true);
  }
}

/* ------------------------------------------------------------------ */
/* Edition OG images: 1200 × 630 landscape adaptations of the three    */
/* compositions. Same machinery, same floors policy, no truncation.    */
/* ------------------------------------------------------------------ */

export const EDITION_OG = { width: 1200, height: 630 } as const;

export type EditionOgLayout = {
  quote: TextFit; book: TextFit; author: TextFit; name: TextFit; date: TextFit;
  regions: Record<"quote" | "book" | "author" | "name" | "date" | "creditLabel" | "readerLabel" | "signature", CardRegion>;
  quoteLeading: number; nameLeading: number;
  bandTop: number;
};

function ogFit(role: EditionRole, measure: EditionMeasure, raw: string, region: CardRegion, max: number, min: number, leading: number): TextFit {
  return fitText(raw.replace(/\s+/gu, " "), {
    width: region.width, height: region.height, maxFontSize: max, minFontSize: min, leading,
    measure: (value, size) => measure(role, value, size),
  });
}

const ogMeasure: EditionMeasure = (role, value, size) =>
  estimateTextWidth(value, size, role === "quote" || role === "book" ? role : undefined);

function fitOgCredit(text: EditionText, measure: EditionMeasure, zone: CardRegion, ticket: boolean,
  leading: { book: number; author: number }, labelHeight: number) {
  const maxBook = ticket ? 22 : 26;
  for (let size = maxBook; size >= 14; size--) {
    try {
      const book = ogFit("book", measure, text.book, { ...zone, height: ticket ? 146 : 54 }, size, size, leading.book);
      const authorMax = Math.max(12, 20 - (maxBook - size));
      const author = ogFit("author", measure, text.byline, { ...zone, height: ticket ? 86 : 40 }, authorMax, 12, leading.author);
      if (labelHeight + book.height + 4 + author.height <= zone.height) return { book, author };
    } catch (error) {
      if (!(error instanceof RangeError)) throw error;
    }
  }
  throw new RangeError("Full title, author and year do not fit the landscape credit");
}

/** Explicit landscape cuts. The Bookplate uses one open left edge, the Poster
 * retains its band, and the Ticket retains its separate stub. Fit the complete
 * credit before reserving the quote; a year can never paint over the footer. */
export function layoutEditionOg(text: EditionText, edition: CardTemplateId, measure?: EditionMeasure): EditionOgLayout {
  const m = measure ?? ogMeasure;
  const ticket = edition === "ticket-v1";
  const poster = edition === "poster-v1";
  const quoteLeading = editionLeading(text.quoteScript, edition, "quote");
  const nameLeading = editionLeading(text.nameScript, edition, "name");
  const bookLeading = editionLeading(text.bookScript, edition, "metadata");
  const authorLeading = editionLeading(text.authorScript, edition, "metadata");
  const creditZone = ticket ? { x: 912, y: 44, width: 256, height: 262 } : { x: 64, y: 0, width: 1072, height: 112 };
  const labelHeight = ticket ? 22 : 20;
  const { book, author } = fitOgCredit(text, m, creditZone, ticket, { book: bookLeading, author: authorLeading }, labelHeight);
  const creditHeight = labelHeight + book.height + 4 + author.height;
  const quoteZone = ticket ? { x: 64, y: 156, width: 752, height: 314 }
    : { x: 64, y: poster ? 116 : 124, width: 1072, height: (poster ? 500 : 498) - creditHeight - 18 - (poster ? 116 : 124) };
  const quote = ogFit("quote", m, text.quote, quoteZone, ticket ? 36 : poster ? 46 : 38,
    poster ? 24 : !ticket && text.quoteScript === "bengali" ? 20 : 22, quoteLeading);
  const creditTop = ticket ? creditZone.y : quoteZone.y + quote.height + 18;
  const nameZone = ticket ? { x: 942, y: 0, width: 196, height: 72 } : { x: 64, y: poster ? 546 : 540, width: 1072, height: 42 };
  const name = ogFit("name", m, text.name, nameZone, ticket ? 24 : 26, 14, nameLeading);
  const readerTop = ticket ? 448 - (16.9 + 10 + name.height) / 2 : poster ? 522 : 518;
  const dateZone = ticket ? { x: 64, y: 540, width: 500, height: 24 }
    : { x: 64, y: poster ? 594 : 596, width: 1072, height: 21 };
  const date = ogFit("date", m, text.date, dateZone, 15, 12, 1.35);
  return {
    quote, book, author, name, date, quoteLeading, nameLeading, bandTop: 510,
    regions: {
      quote: quoteZone,
      creditLabel: { ...creditZone, y: creditTop, height: labelHeight },
      book: { ...creditZone, y: creditTop + labelHeight, height: book.height },
      author: { ...creditZone, y: creditTop + labelHeight + book.height + 4, height: author.height },
      readerLabel: { x: nameZone.x, y: readerTop, width: nameZone.width, height: ticket ? 16.9 : 18.2 },
      name: { ...nameZone, y: ticket ? readerTop + 26.9 : nameZone.y, height: name.height },
      date: { ...dateZone, height: date.height },
      signature: { x: 64, y: 587, width: 150, height: 3 },
    },
  };
}
