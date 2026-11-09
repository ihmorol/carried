import type { CardScript } from "./card-presentation";

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

/** Conservative metric for server/SSR layout, which has no canvas. The
 * real canvas uses loaded-font metrics. Wide Latin glyphs and each Bengali
 * base glyph receive extra room; marks remain attached to their cluster.
 */
export function estimateTextWidth(text: string, fontSize: number, role: "serif" | "mono" = "serif"): number {
  let units = 0;
  for (const char of Array.from(text)) {
    if (/\p{Mark}|[\u200c\u200d\r\n]/u.test(char)) continue;
    if (/\s/u.test(char)) units += 0.34;
    else if (/[\u0980-\u09ff]/u.test(char)) units += 0.92;
    else if (role === "mono") units += 0.65;
    else if (/[MW@%&]/u.test(char)) units += 1.12;
    else if (/[A-Z]/u.test(char)) units += 0.78;
    else if (/[ilI.,'!:;|]/u.test(char)) units += 0.38;
    else if (/[a-z0-9]/u.test(char)) units += 0.64;
    else units += 1.15;
  }
  return units * fontSize;
}

export type CardText = {
  quote: string; title: string; byline: string; name: string;
  quoteScript: CardScript; titleScript: CardScript; authorScript: CardScript; nameScript: CardScript;
};
export type CardRegion = { x: number; y: number; width: number; height: number };

/** Portrait export and landscape preview are cuts of the same artifact.
 * Explicit, disjoint regions prevent long quotes from pushing into metadata
 * or the rotated stamp. The stamp's rotation clearance is outside its box.
 */
export const CARD_REGIONS = {
  png: {
    quote: { x: 92, y: 210, width: 896, height: 570 },
    title: { x: 92, y: 856, width: 896, height: 116 },
    byline: { x: 92, y: 980, width: 896, height: 80 },
    stamp: { x: 260, y: 1094, width: 560, height: 152 },
    name: { x: 284, y: 1136, width: 512, height: 64 },
  },
  og: {
    quote: { x: 82, y: 145, width: 1036, height: 230 },
    title: { x: 82, y: 429, width: 636, height: 88 },
    byline: { x: 82, y: 520, width: 636, height: 58 },
    stamp: { x: 788, y: 427, width: 312, height: 144 },
    name: { x: 804, y: 466, width: 280, height: 64 },
  },
} as const;

export function layoutCardText(content: CardText, surface: "png" | "og", measure?: (role: "quote" | "title" | "byline" | "name", text: string, size: number) => number) {
  const regions = CARD_REGIONS[surface];
  const portrait = surface === "png";
  const fit = (role: "quote" | "title" | "byline" | "name", text: string, script: CardScript, max: number, min: number) => fitText(text, {
    ...regions[role], maxFontSize: max, minFontSize: min,
    leading: script === "bengali" ? 1.65 : role === "quote" ? 1.42 : 1.3,
    measure: (value, size) => measure ? measure(role, value, size) : estimateTextWidth(value, size, role === "byline" ? "mono" : "serif"),
  });
  return {
    quote: fit("quote", content.quote, content.quoteScript, 64, portrait ? 30 : 24),
    title: fit("title", content.title, content.titleScript, portrait ? 40 : 38, portrait ? 22 : 16),
    byline: fit("byline", content.byline, content.authorScript, portrait ? 25 : 21, portrait ? 18 : 16),
    name: fit("name", content.name, content.nameScript, portrait ? 46 : 34, portrait ? 22 : 18),
  };
}
