/**
 * The card "inks" (color schemes), shared by the DOM card, the canvas
 * export and the satori OG renderer so all three always agree.
 *
 * Every ink is five flat colors, never a gradient. `stamp` is the one
 * accent on a card; everything else is text, soft text and hairline.
 * The first three are the original library inks; old links keep them.
 * Inks are grouped into style collections in `lib/card-style.ts`.
 */
export type InkId =
  // library
  | "paper"
  | "midnight"
  | "moss"
  | "oxblood"
  // modern
  | "chalk"
  | "graphite"
  | "cobalt"
  | "blush"
  // retro
  | "mustard"
  | "teal"
  | "tomato"
  | "cream"
  // vintage
  | "parchment"
  | "sepia"
  | "navy"
  | "burgundy"
  // keepsake
  | "cotton"
  | "kraft"
  | "onyx"
  | "sage";

export type Ink = {
  id: InkId;
  label: string;
  /** Bangla label for the picker */
  labelBn: string;
  bg: string;
  text: string;
  soft: string;
  rule: string;
  stamp: string;
};

function ink(
  id: InkId,
  label: string,
  labelBn: string,
  bg: string,
  text: string,
  soft: string,
  rule: string,
  stamp: string,
): Ink {
  return { id, label, labelBn, bg, text, soft, rule, stamp };
}

export const INKS: Record<InkId, Ink> = {
  paper: ink("paper", "Paper", "পেপার", "#faf6ea", "#211d17", "#6d6354", "#d8cdb6", "#b23c25"),
  midnight: ink("midnight", "Midnight", "মধ্যরাত", "#1c1814", "#f2ecdd", "#a2977f", "#4a4234", "#d4644a"),
  moss: ink("moss", "Moss", "মস", "#2c3a30", "#f0ead8", "#a8b39a", "#4d5c4e", "#e0a458"),
  oxblood: ink("oxblood", "Oxblood", "গাঢ় লাল", "#5a2320", "#f3e7d3", "#d2b2a3", "#7a3d37", "#e8b15c"),

  chalk: ink("chalk", "Chalk", "চক", "#f5f4f0", "#1b1b1b", "#625f59", "#dcd9d1", "#d9481f"),
  graphite: ink("graphite", "Graphite", "গ্রাফাইট", "#23262b", "#eef0f2", "#a3aab4", "#3d424a", "#ff7a59"),
  cobalt: ink("cobalt", "Cobalt", "কোবাল্ট", "#233f8f", "#f6f3ea", "#c3cce8", "#3f5aa6", "#ffcf5c"),
  blush: ink("blush", "Blush", "গোলাপি", "#f2ddd5", "#2b1d1a", "#735a53", "#ddbfb3", "#b23a0b"),

  mustard: ink("mustard", "Mustard", "সরিষা", "#e8b84a", "#2a1d10", "#5a4120", "#c99a33", "#9c2c19"),
  teal: ink("teal", "Teal", "টিল", "#17524e", "#f8eed6", "#b5d4cc", "#2c6a65", "#f2a541"),
  tomato: ink("tomato", "Tomato", "টমেটো", "#963020", "#fff5e6", "#f3cdb3", "#ad4a39", "#f8d47a"),
  cream: ink("cream", "Cream Soda", "ক্রিম", "#f4e7c8", "#2f2318", "#6e573e", "#dfcb9f", "#c63f26"),

  parchment: ink("parchment", "Parchment", "পার্চমেন্ট", "#eedfbf", "#3a2817", "#6f573c", "#d6c193", "#8e2c1d"),
  sepia: ink("sepia", "Sepia", "সেপিয়া", "#d8c19c", "#2e2114", "#5c462e", "#bba179", "#7b2617"),
  navy: ink("navy", "Navy & Gold", "নীল ও সোনালি", "#1c2a45", "#ede1c8", "#adb4c3", "#36456a", "#d1ad5a"),
  burgundy: ink("burgundy", "Burgundy", "বারগান্ডি", "#4b1d26", "#f2e4d0", "#cfaeab", "#6b3540", "#dcb66c"),

  cotton: ink("cotton", "Cotton", "সুতি", "#f8f6f0", "#24221e", "#67635a", "#e2ddd1", "#b23c25"),
  kraft: ink("kraft", "Kraft", "ক্রাফট", "#c7a378", "#2a1c0f", "#4f3822", "#a98a5f", "#761d11"),
  onyx: ink("onyx", "Onyx & Foil", "অনিক্স ও ফয়েল", "#151515", "#ede7d7", "#a19c90", "#333230", "#c9a85c"),
  sage: ink("sage", "Sage", "সেজ", "#dde4d4", "#22301e", "#56634f", "#c3ccb8", "#a3432b"),
};

export const INK_IDS = Object.keys(INKS) as InkId[];

export function isInkId(v: string): v is InkId {
  return Object.prototype.hasOwnProperty.call(INKS, v);
}
