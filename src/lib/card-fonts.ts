/**
 * Card typefaces: the face the line and the signature are set in.
 * UI, labels and ledger metadata stay in IBM Plex Mono on every card;
 * only the voice of the line changes. Bangla lines always fall back to
 * Noto Serif Bengali, whatever face is chosen, because none of these
 * carry Bengali glyphs.
 *
 * All files live in /public/fonts (SIL Open Font License, from Google
 * Fonts) and are read by all three surfaces: the DOM via @font-face in
 * globals.css, the canvas via FontFace, satori via readFileSync.
 */
export type CardFontId =
  | "fraunces"
  | "playfair"
  | "cormorant"
  | "fell"
  | "dmserif"
  | "grotesk"
  | "abril"
  | "courier"
  | "caveat";

export type FontFaceSpec = { file: string; weight: 400 | 500 | 600 | 700; style: "normal" | "italic" };

export type CardFont = {
  id: CardFontId;
  label: string;
  labelBn: string;
  /** family name registered in every surface */
  family: string;
  /** face used for the line itself */
  quote: FontFaceSpec;
  /** face used for the signature in the stamp and the book title */
  name: FontFaceSpec;
  /** optical size correction so every face reads at the same size */
  scale: number;
  /** line height for latin text */
  leading: number;
};

const SAME = (spec: FontFaceSpec) => ({ quote: spec, name: spec });

export const CARD_FONTS: Record<CardFontId, CardFont> = {
  fraunces: {
    id: "fraunces",
    label: "Fraunces",
    labelBn: "ফ্রন্সেস",
    family: "Fraunces",
    quote: { file: "Fraunces-Italic-500.ttf", weight: 500, style: "italic" },
    name: { file: "Fraunces-600.ttf", weight: 600, style: "normal" },
    scale: 1,
    leading: 1.5,
  },
  playfair: {
    id: "playfair",
    label: "Playfair",
    labelBn: "প্লেফেয়ার",
    family: "Card Playfair",
    ...SAME({ file: "PlayfairDisplay-Italic-500.ttf", weight: 500, style: "italic" }),
    scale: 1,
    leading: 1.48,
  },
  cormorant: {
    id: "cormorant",
    label: "Garamond",
    labelBn: "গ্যারামন্ড",
    family: "Card Cormorant",
    ...SAME({ file: "CormorantGaramond-Italic-600.ttf", weight: 600, style: "italic" }),
    scale: 1.14,
    leading: 1.36,
  },
  fell: {
    id: "fell",
    label: "Fell Type",
    labelBn: "ফেল টাইপ",
    family: "Card Fell",
    ...SAME({ file: "IMFellEnglish-Italic.ttf", weight: 400, style: "italic" }),
    scale: 1.08,
    leading: 1.42,
  },
  dmserif: {
    id: "dmserif",
    label: "Display",
    labelBn: "ডিসপ্লে",
    family: "Card DM Serif",
    ...SAME({ file: "DMSerifDisplay-400.ttf", weight: 400, style: "normal" }),
    scale: 1.02,
    leading: 1.36,
  },
  grotesk: {
    id: "grotesk",
    label: "Grotesk",
    labelBn: "গ্রোটেস্ক",
    family: "Card Grotesk",
    ...SAME({ file: "SpaceGrotesk-500.ttf", weight: 500, style: "normal" }),
    scale: 0.94,
    leading: 1.42,
  },
  abril: {
    id: "abril",
    label: "Fatface",
    labelBn: "ফ্যাটফেস",
    family: "Card Abril",
    ...SAME({ file: "AbrilFatface-400.ttf", weight: 400, style: "normal" }),
    scale: 0.96,
    leading: 1.34,
  },
  courier: {
    id: "courier",
    label: "Typewriter",
    labelBn: "টাইপরাইটার",
    family: "Card Courier",
    ...SAME({ file: "CourierPrime-400.ttf", weight: 400, style: "normal" }),
    scale: 0.88,
    leading: 1.5,
  },
  caveat: {
    id: "caveat",
    label: "Handwritten",
    labelBn: "হাতের লেখা",
    family: "Card Caveat",
    ...SAME({ file: "Caveat-600.ttf", weight: 600, style: "normal" }),
    scale: 1.3,
    leading: 1.22,
  },
};

export const CARD_FONT_IDS = Object.keys(CARD_FONTS) as CardFontId[];
export const DEFAULT_FONT: CardFontId = "fraunces";

export function isCardFontId(v: string): v is CardFontId {
  return Object.prototype.hasOwnProperty.call(CARD_FONTS, v);
}

/** CSS font-family stack for the DOM card. */
export function cssFamily(font: CardFont): string {
  if (font.id === "fraunces") return "var(--font-serif)";
  return `"${font.family}", var(--font-noto-serif-bengali), Georgia, serif`;
}
