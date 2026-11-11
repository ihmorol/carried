import { INKS, type Ink, type InkId } from "./inks";
import { CARD_FONTS, DEFAULT_FONT, isCardFontId, type CardFont, type CardFontId } from "./card-fonts";
import { DEFAULT_PATTERN, PATTERNS, isPatternId, type Pattern, type PatternId } from "./card-art";

/**
 * Style collections: how the picker groups inks, patterns and typefaces.
 * A collection is a starting point, not a cage. It lists the options that
 * belong together, and choosing it applies its first ink, pattern and face.
 *
 * A card's look is three independent choices carried in the payload:
 *   s, the ink (always present), p, the pattern, f, the typeface.
 * p and f are omitted when they're the defaults, so every link minted
 * before collections existed still decodes to the exact same card.
 */
export type StyleGroupId = "library" | "modern" | "retro" | "vintage" | "keepsake";

export type StyleGroup = {
  id: StyleGroupId;
  label: string;
  labelBn: string;
  blurb: string;
  blurbBn: string;
  inks: InkId[];
  patterns: PatternId[];
  fonts: CardFontId[];
};

export const STYLE_GROUPS: StyleGroup[] = [
  {
    id: "library",
    label: "Library",
    labelBn: "লাইব্রেরি",
    blurb: "The original catalog card: double rule, warm paper, a library stamp.",
    blurbBn: "আসল ক্যাটালগ কার্ড: ডাবল রুল, উষ্ণ কাগজ, লাইব্রেরির সিল।",
    inks: ["paper", "midnight", "moss", "oxblood"],
    patterns: ["classic", "lined", "dots"],
    fonts: ["fraunces", "cormorant", "courier"],
  },
  {
    id: "modern",
    label: "Modern",
    labelBn: "মডার্ন",
    blurb: "Clean stock, bright accents, a notebook grid or a painted edge.",
    blurbBn: "পরিষ্কার কাগজ, উজ্জ্বল রং, নোটবুক গ্রিড বা রঙিন কিনারা।",
    inks: ["chalk", "graphite", "cobalt", "blush"],
    patterns: ["edge", "grid", "dots", "classic"],
    fonts: ["grotesk", "dmserif", "fraunces"],
  },
  {
    id: "retro",
    label: "Retro",
    labelBn: "রেট্রো",
    blurb: "Seventies paperback: sunbursts, ticket stripes, fat type.",
    blurbBn: "সত্তরের পেপারব্যাক: সূর্যরশ্মি, টিকিট স্ট্রাইপ, মোটা অক্ষর।",
    inks: ["mustard", "teal", "tomato", "cream"],
    patterns: ["sunburst", "stripes", "halftone"],
    fonts: ["abril", "courier", "caveat"],
  },
  {
    id: "vintage",
    label: "Vintage",
    labelBn: "ভিনটেজ",
    blurb: "Old-world printing: flourishes, deco frames, foxed paper.",
    blurbBn: "পুরনো ছাপাখানা: নকশা, ডেকো ফ্রেম, পুরনো কাগজ।",
    inks: ["parchment", "sepia", "navy", "burgundy"],
    patterns: ["ornate", "deco", "classic"],
    fonts: ["fell", "playfair", "cormorant"],
  },
  {
    id: "keepsake",
    label: "Keepsake",
    labelBn: "স্মারক",
    blurb: "Fine stationery: cotton stock, letterpress plates, foil and botanicals.",
    blurbBn: "সূক্ষ্ম স্টেশনারি: সুতি কাগজ, লেটারপ্রেস, ফয়েল আর লতাপাতা।",
    inks: ["cotton", "kraft", "onyx", "sage"],
    patterns: ["letterpress", "botanical", "edge", "deco"],
    fonts: ["cormorant", "playfair", "caveat"],
  },
];

export function getGroup(id: StyleGroupId): StyleGroup {
  return STYLE_GROUPS.find((g) => g.id === id) ?? STYLE_GROUPS[0];
}

/** The collection an ink belongs to (each ink lives in exactly one). */
export function groupOfInk(ink: InkId): StyleGroup {
  return STYLE_GROUPS.find((g) => g.inks.includes(ink)) ?? STYLE_GROUPS[0];
}

export type CardStyle = { ink: InkId; pattern: PatternId; font: CardFontId };

/** The collection's first ink, pattern and face. */
export function groupDefaults(id: StyleGroupId): CardStyle {
  const g = getGroup(id);
  return { ink: g.inks[0], pattern: g.patterns[0], font: g.fonts[0] };
}

export type ResolvedStyle = { ink: Ink; pattern: Pattern; font: CardFont };

/** Resolve a payload's style fields, tolerating anything unknown. */
export function resolveStyle(p: { s: InkId; p?: string; f?: string }): ResolvedStyle {
  const ink = INKS[p.s] ?? INKS.paper;
  const pattern = PATTERNS[p.p && isPatternId(p.p) ? p.p : DEFAULT_PATTERN];
  const font = CARD_FONTS[p.f && isCardFontId(p.f) ? p.f : DEFAULT_FONT];
  return { ink, pattern, font };
}

/** Payload style fields, dropping the defaults so old ids stay stable. */
export function styleFields(style: { pattern?: PatternId; font?: CardFontId }): { p?: PatternId; f?: CardFontId } {
  const out: { p?: PatternId; f?: CardFontId } = {};
  if (style.pattern && style.pattern !== DEFAULT_PATTERN) out.p = style.pattern;
  if (style.font && style.font !== DEFAULT_FONT) out.f = style.font;
  return out;
}
