/**
 * The three card "inks" — shared by the DOM card, the canvas export
 * and the satori OG renderer so all three always agree.
 */
export type InkId = "paper" | "midnight" | "moss";

export type Ink = {
  id: InkId;
  label: string;
  bg: string;
  text: string;
  soft: string;
  rule: string;
  stamp: string;
};

export const INKS: Record<InkId, Ink> = {
  paper: {
    id: "paper",
    label: "Paper",
    bg: "#faf6ea",
    text: "#211d17",
    soft: "#6d6354",
    rule: "#d8cdb6",
    stamp: "#b23c25",
  },
  midnight: {
    id: "midnight",
    label: "Midnight",
    bg: "#1c1814",
    text: "#f2ecdd",
    soft: "#a2977f",
    rule: "#4a4234",
    stamp: "#d4644a",
  },
  moss: {
    id: "moss",
    label: "Moss",
    bg: "#2c3a30",
    text: "#f0ead8",
    soft: "#a8b39a",
    rule: "#4d5c4e",
    stamp: "#e0a458",
  },
};

export const INK_IDS = Object.keys(INKS) as InkId[];

export function isInkId(v: string): v is InkId {
  return INK_IDS.includes(v as InkId);
}
