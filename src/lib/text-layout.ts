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
  quote: string; name: string; book: string; author: string; date: string; accession: string;
  /** The card's primary language (the quote's script): labels and root lang. */
  language: CardScript;
  quoteScript: CardScript; nameScript: CardScript; bookScript: CardScript; authorScript: CardScript; dateScript: CardScript;
};

type EditionRegion = { width: number; height: number; size: number; min: number };
type EditionRole = "quote" | "name" | "book" | "author" | "date";
export type EditionMeasure = (role: EditionRole, text: string, size: number) => number;

/** Fitting regions per edition, in print-space pixels at 360 × 450.
 * Floors scale with the artwork, not the viewport: quote ≥ 14px, name and
 * metadata ≥ 8–9px at 360w. Heights are sized so the 220/24/90/60 input
 * limits always fit every edition — no renderer may crop instead. */
const EDITION_TYPE_REGIONS: Record<CardTemplateId, Record<Exclude<EditionRole, "date">, EditionRegion>> = {
  "bookplate-v1": {
    quote: { width: 288, height: 200, size: 28, min: 14 },
    name: { width: 166, height: 42, size: 20, min: 9 },
    book: { width: 288, height: 52, size: 17, min: 9 },
    author: { width: 288, height: 40, size: 12, min: 9 },
  },
  "poster-v1": {
    quote: { width: 304, height: 197, size: 34, min: 14 },
    name: { width: 164, height: 42, size: 22, min: 9 },
    book: { width: 304, height: 52, size: 17, min: 9 },
    author: { width: 304, height: 40, size: 12, min: 9 },
  },
  "ticket-v1": {
    quote: { width: 300, height: 196, size: 26, min: 14 },
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
  /** Quote block position in print-space pixels. */
  quoteTop: number; quoteInset: number; quoteHeight: number;
  quoteY: number;
  credit: { top: number; inset: number; width: number; labelHeight: number; gap: number };
  ownership: { top: number; height: number; nameHeight: number; gap: number };
  bandTop: number;
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

/** The stub credit shares one size between title and author so their combined
 * block can never outrun the 117px stub, whatever the limits throw at it. */
function fitTicketCredit(measure: EditionMeasure, text: EditionText, leading: { book: number; author: number }): { book: TextFit; author: TextFit } {
  const region = EDITION_TYPE_REGIONS["ticket-v1"];
  for (let size = region.book.size; size >= region.book.min; size--) {
    try {
      const book = editionFit("book", measure, text.book, { ...region.book, size, min: size }, leading.book);
      const author = editionFit("author", measure, text.author, { ...region.author, size, min: size }, leading.author);
      if (12.35 + 3 + book.height + author.height <= 114) return { book, author };
    } catch (error) {
      if (!(error instanceof RangeError)) throw error;
    }
  }
  throw new RangeError("Full text does not fit the ticket stub");
}

/** Typesets the 4:5 edition artwork in print-space pixels. Try the approved
 * furniture first; only exceptional input limits switch to the dense layout,
 * which tightens furniture and permits grapheme-safe breaks instead of
 * dropping a single character. */
export function layoutEditionArtwork(text: EditionText, edition: CardTemplateId, measure?: EditionMeasure): EditionLayout {
  const regions = EDITION_TYPE_REGIONS[edition];
  const m: EditionMeasure = measure ?? ((role, value, size) =>
    // Quote and book speak the serif text voice; names and metadata stay sans.
    estimateTextWidth(value, size, role === "quote" || role === "book" ? role : undefined));
  const quoteLeading = editionLeading(text.language, edition, "quote");
  const nameLeading = editionLeading(text.nameScript === "bengali" ? "bengali" : "latin", edition, "name");
  const bookLeading = editionLeading(text.bookScript === "bengali" ? "bengali" : "latin", edition, "metadata");
  const authorLeading = editionLeading(text.authorScript === "bengali" ? "bengali" : "latin", edition, "metadata");
  let book: TextFit;
  let author: TextFit;
  if (edition === "ticket-v1") {
    ({ book, author } = fitTicketCredit(m, text, { book: bookLeading, author: authorLeading }));
  } else {
    book = editionFit("book", m, text.book, regions.book, bookLeading);
    author = editionFit("author", m, text.author, regions.author, authorLeading);
  }
  let nameRegion = regions.name;
  let quoteTop = edition === "bookplate-v1" ? 82 : edition === "poster-v1" ? 78 : 95;
  let quoteInset = (EDITION_ARTWORK.width - regions.quote.width) / 2;
  const creditHeight = 14.3 + 3 + book.height + author.height;
  let quoteHeight = edition === "ticket-v1" ? regions.quote.height : (edition === "bookplate-v1" ? 322 : 326) - creditHeight - 12 - quoteTop;
  // Length tiers steady the visual voice; fitting is only the safety net.
  const quoteSize = Math.min(regions.quote.size, text.quote.length > 140 ? 24 : text.quote.length > 70 ? 26 : regions.quote.size);
  let dense = false;
  let quote;
  try {
    quote = editionFit("quote", m, text.quote, { ...regions.quote, size: quoteSize, height: quoteHeight }, quoteLeading);
  } catch (error) {
    if (!(error instanceof RangeError)) throw error;
    dense = true;
    quoteTop = edition === "bookplate-v1" ? 46 : edition === "poster-v1" ? 40 : 40;
    quoteInset = 12;
    quoteHeight = 264;
    quote = editionFit("quote", m, text.quote, { ...regions.quote, width: EDITION_ARTWORK.width - quoteInset * 2, height: quoteHeight }, quoteLeading, true);
    if (edition !== "ticket-v1") {
      // Dense credits keep a compact, explicit stack above the ownership mark.
      const creditWidth = EDITION_ARTWORK.width - quoteInset * 2;
      book = editionFit("book", m, text.book, { width: creditWidth, height: 34, size: 8, min: 8 }, bookLeading, true);
      author = editionFit("author", m, text.author, { width: creditWidth, height: 24, size: 8, min: 8 }, authorLeading, true);
      nameRegion = { ...nameRegion, height: 28, size: 18 };
    }
  }
  let name;
  let nameBreaks = false;
  try {
    name = editionFit("name", m, text.name, nameRegion, nameLeading);
  } catch (error) {
    if (!(error instanceof RangeError)) throw error;
    nameBreaks = true;
    name = editionFit("name", m, text.name, nameRegion, nameLeading, true);
  }
  const labelHeight = dense && edition !== "ticket-v1" ? 10.4 : 14.3;
  const creditGap = dense ? 1 : 3;
  const creditSize = labelHeight + creditGap + book.height + author.height;
  const bandTop = dense && edition === "poster-v1" ? 370 : 333;
  const creditTop = edition === "ticket-v1"
    ? 333 + (117 - creditSize) / 2
    : dense ? 307 : (edition === "bookplate-v1" ? 322 : 326) - creditSize;
  return {
    dense,
    quote, name, book, author,
    quoteLeading, nameLeading, bookLeading, authorLeading,
    quoteTop, quoteInset, quoteHeight,
    quoteY: quoteTop + Math.max(0, (quoteHeight - quote.height) / 2),
    credit: {
      top: creditTop,
      inset: edition === "ticket-v1" ? 27 : dense ? 12 : edition === "bookplate-v1" ? 36 : 28,
      width: edition === "ticket-v1" ? 196 : dense ? 336 : regions.book.width,
      labelHeight, gap: creditGap,
    },
    ownership: { top: dense && edition !== "ticket-v1" ? 376 : edition === "poster-v1" ? 340 : 338,
      height: dense && edition !== "ticket-v1" ? 68 : edition === "poster-v1" ? 88 : 86,
      nameHeight: dense && edition !== "ticket-v1" ? 28 : Math.max(30, name.height), gap: dense ? 1 : 2 },
    bandTop,
    nameBreaks,
  };
}

/* ------------------------------------------------------------------ */
/* Edition OG images: 1200 × 630 landscape adaptations of the three    */
/* compositions. Same machinery, same floors policy, no truncation.    */
/* ------------------------------------------------------------------ */

export const EDITION_OG = { width: 1200, height: 630 } as const;

export type EditionOgLayout = {
  quote: TextFit; book: TextFit; author: TextFit; name: TextFit; date: TextFit;
  regions: {
    quote: CardRegion; book: CardRegion; author: CardRegion; name: CardRegion; date: CardRegion;
  };
  quoteLeading: number; nameLeading: number;
};

function ogFit(role: EditionRole, measure: EditionMeasure, raw: string, region: CardRegion, max: number, min: number, leading: number): TextFit {
  const normalized = raw.replace(/\s+/gu, " ");
  return fitText(normalized, {
    width: region.width, height: region.height, maxFontSize: max, minFontSize: min, leading,
    measure: (value, size) => measure(role, value, size),
  });
}

const ogMeasure: EditionMeasure = (role, value, size) =>
  estimateTextWidth(value, size, role === "quote" || role === "book" ? role : undefined);

/** Landscape furniture per edition: quote column, the credit stack (label
 * height, title/author zone) and the ownership block (mark furniture with
 * name/date zones). All pixels at 1200 × 630. */
const OG_BOOK_REGIONS: Record<CardTemplateId, {
  quote: CardRegion; credit: CardRegion; labelHeight: number;
  ownership: CardRegion; nameZone: CardRegion; dateZone: CardRegion; nameMax: number;
}> = {
  // Bookplate: centered inscription under the header, type-only ownership
  // with the coral signature rule at the foot. The name keeps the same
  // 42px two-line Bengali floor the landscape cut has always reserved.
  "bookplate-v1": {
    quote: { x: 140, y: 126, width: 920, height: 250 },
    credit: { x: 140, y: 384, width: 920, height: 106 }, labelHeight: 24,
    ownership: { x: 370, y: 494, width: 460, height: 88 },
    nameZone: { x: 414, y: 512, width: 372, height: 42 },
    dateZone: { x: 414, y: 562, width: 372, height: 17 },
    nameMax: 26,
  },
  // Poster: full-bleed reversed field; the coral band carries the ownership
  // as a straight credit line aligned with the quote.
  "poster-v1": {
    quote: { x: 88, y: 128, width: 1024, height: 280 },
    credit: { x: 88, y: 418, width: 1024, height: 88 }, labelHeight: 20,
    ownership: { x: 88, y: 510, width: 500, height: 120 },
    nameZone: { x: 88, y: 544, width: 500, height: 44 },
    dateZone: { x: 88, y: 594, width: 500, height: 20 },
    nameMax: 26,
  },
  // Ticket: the body column sits left of the vertical perforation; the stub
  // carries the credit and the circular cancellation.
  "ticket-v1": {
    quote: { x: 64, y: 156, width: 752, height: 314 },
    credit: { x: 912, y: 44, width: 256, height: 240 }, labelHeight: 22,
    ownership: { x: 928, y: 356, width: 224, height: 152 },
    nameZone: { x: 942, y: 388, width: 196, height: 72 },
    dateZone: { x: 64, y: 540, width: 400, height: 24 },
    nameMax: 24,
  },
};

const OG_QUOTE_TYPE: Record<CardTemplateId, { max: number; min: number }> = {
  "bookplate-v1": { max: 38, min: 22 },
  "poster-v1": { max: 46, min: 24 },
  "ticket-v1": { max: 36, min: 22 },
};

/** Bengali tiered floor for the bookplate OG quote (22 → 20). Serif quote
 * units are wider than the sans units this 22px floor was cut against
 * (আ 1.36 vs 1.3), so the widest legal quote — the 220-char cap of আ — now
 * needs an eighth 22px line in the 250px bookplate OG region
 * (8 × 22 × 1.45 = 255.2 > 250), which refused instead of rendering the
 * share card. fitText descends from the max size, so every quote that fits
 * at 22px or above keeps its approved size; extending the floor to 20px —
 * the floor of sanity for a 1200×630 preview — seats the worst case
 * (8 × 20 × 1.45 = 232 ≤ 250) with margin for metric drift. Over-cap input
 * still RangeErrors; nothing is ever cropped. */
const OG_BOOKPLATE_BENGALI_MIN = 20;

/** Landscape cut of each edition. Regions follow the fitted text; every
 * bilingual limit fits without truncation or script loss. */
export function layoutEditionOg(text: EditionText, edition: CardTemplateId, measure?: EditionMeasure): EditionOgLayout {
  const m = measure ?? ogMeasure;
  const regions = OG_BOOK_REGIONS[edition];
  const quoteType = OG_QUOTE_TYPE[edition];
  const quoteLeading = editionLeading(text.language, edition, "quote");
  const nameLeading = editionLeading(text.nameScript === "bengali" ? "bengali" : "latin", edition, "name");
  const bookLeading = editionLeading(text.bookScript === "bengali" ? "bengali" : "latin", edition, "metadata");
  const authorLeading = editionLeading(text.authorScript === "bengali" ? "bengali" : "latin", edition, "metadata");
  // Bookplate Bengali tier (see OG_BOOKPLATE_BENGALI_MIN): the lower floor
  // only engages below the approved 22px, so approved type is unchanged.
  const quoteMin = edition === "bookplate-v1" && text.language === "bengali"
    ? OG_BOOKPLATE_BENGALI_MIN
    : quoteType.min;
  const quote = ogFit("quote", m, text.quote, regions.quote, quoteType.max, quoteMin, quoteLeading);
  const book = ogFit("book", m, text.book,
    { ...regions.credit, y: regions.credit.y + regions.labelHeight, height: edition === "ticket-v1" ? 160 : 42 },
    edition === "ticket-v1" ? 22 : 26, 14, bookLeading);
  const author = ogFit("author", m, text.author,
    { ...regions.credit, y: regions.credit.y + regions.labelHeight + book.height + 4, height: edition === "ticket-v1" ? 52 : 38 },
    20, 12, authorLeading);
  const name = ogFit("name", m, text.name, regions.nameZone, regions.nameMax, 14, nameLeading);
  const date = ogFit("date", m, text.date, regions.dateZone, 18, 12, 1.35);
  return {
    quote, book, author, name, date,
    regions: {
      quote: regions.quote,
      book: { ...regions.credit, y: regions.credit.y + regions.labelHeight, height: book.height },
      author: { ...regions.credit, y: regions.credit.y + regions.labelHeight + book.height + 4, height: author.height },
      name: { ...regions.nameZone, height: name.height },
      date: { ...regions.dateZone, height: date.height },
    },
    quoteLeading, nameLeading,
  };
}
