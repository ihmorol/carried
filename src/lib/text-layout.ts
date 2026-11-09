import { CARD_SPACING, CARD_TYPOGRAPHY, cardLeading, type CardScript } from "./card-presentation";

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
 * have width; only nonspacing marks and joiners can be omitted. Canvas uses
 * the loaded faces' shaped metrics instead. */
export function estimateTextWidth(text: string, fontSize: number, role?: "serif" | "mono"): number {
  // Legacy role arguments no longer select monospaced metrics.
  void role;
  let units = 0;
  for (const char of Array.from(text)) {
    if (/[\u0980-\u09ff]/u.test(char)) {
      if (/[\u09cb\u09cc\u09e2\u09e3]/u.test(char)) units += 0.8;
      else if (/[\u0982\u0983]/u.test(char)) units += 0.55;
      else if (/\p{Mc}/u.test(char)) units += 0.36;
      else if (!/\p{Mark}/u.test(char)) units += char === "আ" ? 1.3 : char === "ঞ" ? 1.06 : 1;
    } else if (/\p{Mark}|[\u200c\u200d\r\n]/u.test(char)) continue;
    else if (char === "\t") units += 2.72;
    else if (/\s/u.test(char)) units += 0.34;
    else if (/[MW@%&#]/u.test(char)) units += 1.02;
    else if (/[mw]/u.test(char)) units += 0.92;
    else if (/[A-Z]/u.test(char)) units += 0.8;
    else if (/[il.,'!:;|]/u.test(char)) units += 0.38;
    else if (/[a-z0-9]/u.test(char)) units += 0.68;
    else units += 1.15;
  }
  return units * fontSize;
}

export type CardText = {
  quote: string; title: string; byline: string; name: string; date: string;
  quoteScript: CardScript; titleScript: CardScript; authorScript: CardScript; nameScript: CardScript; dateScript: CardScript;
};
export type CardRegion = { x: number; y: number; width: number; height: number };
export type CardTextRole = "quote" | "title" | "byline" | "name" | "date";

/** Only the safe outer frame is fixed. Every inner region follows actual text. */
export const CARD_SURFACES = {
  png: { width: 1080, height: 1350, padding: 66, scale: 3 },
  og: { width: 1200, height: 630, padding: 44, scale: 2 },
} as const;

/** A compact, vertically centered composition: header, quote, provenance,
 * signature. Surplus image height stays outside the group. Try the normal
 * 20–22px quote range first; only dense, simultaneous input limits reduce
 * the complete type scale, retaining the hierarchy instead of clipping. */
export function layoutCardText(content: CardText, surface: "png" | "og", measure?: (role: CardTextRole, text: string, size: number) => number) {
  const frame = CARD_SURFACES[surface];
  for (let step = 20; step >= 8; step--) {
    try {
      return composeCardText(content, frame, frame.scale * step / 20, measure);
    } catch (error) {
      if (!(error instanceof RangeError)) throw error;
    }
  }
  throw new RangeError("Full text does not fit the card composition");
}

function composeCardText(content: CardText, frame: typeof CARD_SURFACES["png"] | typeof CARD_SURFACES["og"], scale: number, measure?: (role: CardTextRole, text: string, size: number) => number) {
  const { padding: x } = frame;
  const width = frame.width - 2 * x;
  const available = frame.height - 2 * x;
  const gap = (value: number) => value * scale;
  const metadata = CARD_TYPOGRAPHY.metadata * scale;
  const metadataHeight = metadata * cardLeading("latin");
  const fit = (role: CardTextRole, text: string, script: CardScript, fontSize: number, textWidth: number, height = available, min = fontSize) => fitText(text, {
    width: textWidth, height, maxFontSize: fontSize, minFontSize: min, leading: cardLeading(script),
    measure: (value, size) => measure ? measure(role, value, size) : estimateTextWidth(value, size),
  });

  const title = fit("title", content.title, content.titleScript, CARD_TYPOGRAPHY.title * scale, width);
  const byline = fit("byline", content.byline, content.authorScript, metadata, width);
  const stampInset = gap(CARD_SPACING.signaturePaddingX);
  const stampGap = gap(CARD_SPACING.signatureColumnGap);
  const stampInner = width - 2 * stampInset;
  const dateWidth = Math.floor((stampInner - stampGap) * 0.42);
  const nameWidth = stampInner - stampGap - dateWidth;
  const name = fit("name", content.name, content.nameScript, CARD_TYPOGRAPHY.name * scale, nameWidth);
  const date = fit("date", content.date, content.dateScript, metadata, dateWidth);
  const nameOffset = metadataHeight + gap(CARD_SPACING.signatureNameGap);
  const signatureHeight = Math.max(nameOffset + name.height, date.height) + gap(CARD_SPACING.signaturePaddingY * 2);
  const otherHeight = metadataHeight + gap(CARD_SPACING.headerGap + CARD_SPACING.quoteGap + CARD_SPACING.provenanceGap + CARD_SPACING.bylineGap + CARD_SPACING.signatureGap)
    + metadataHeight + title.height + byline.height + signatureHeight;
  const quote = fit("quote", content.quote, content.quoteScript, CARD_TYPOGRAPHY.quote * scale, width, available - otherHeight, CARD_TYPOGRAPHY.quoteMin * scale);
  const height = otherHeight + quote.height;
  const top = (frame.height - height) / 2;
  const region = (y: number, height: number, left: number = x, regionWidth: number = width): CardRegion => ({ x: left, y, width: regionWidth, height });
  const header = region(top, metadataHeight);
  const quoteRegion = region(header.y + header.height + gap(CARD_SPACING.headerGap), quote.height);
  const provenance = region(quoteRegion.y + quote.height + gap(CARD_SPACING.quoteGap), metadataHeight);
  const titleRegion = region(provenance.y + provenance.height + gap(CARD_SPACING.provenanceGap), title.height);
  const bylineRegion = region(titleRegion.y + title.height + gap(CARD_SPACING.bylineGap), byline.height);
  const stamp = region(bylineRegion.y + byline.height + gap(CARD_SPACING.signatureGap), signatureHeight);
  const stampLabel = region(stamp.y + gap(CARD_SPACING.signaturePaddingY), metadataHeight, x + stampInset, nameWidth);
  const nameRegion = region(stampLabel.y + nameOffset, name.height, stampLabel.x, nameWidth);
  const dateRegion = region(stamp.y + (stamp.height - date.height) / 2, date.height, stampLabel.x + nameWidth + stampGap, dateWidth);
  return {
    quote, title, byline, name, date, scale,
    metadata: { fontSize: metadata, lineHeight: metadataHeight },
    composition: region(top, height),
    regions: { header, quote: quoteRegion, provenance, title: titleRegion, byline: bylineRegion, stamp, stampLabel, name: nameRegion, date: dateRegion },
  };
}
