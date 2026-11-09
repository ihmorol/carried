/**
 * The three card "inks", shared by the DOM card, the canvas export
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
    bg: "#fffefa",
    text: "#26292f",
    soft: "#60646c",
    rule: "#dfdfd5",
    stamp: "#b64450",
  },
  midnight: {
    id: "midnight",
    label: "Midnight",
    bg: "#252a34",
    text: "#fbfbf6",
    soft: "#c0c4cd",
    rule: "#49515f",
    stamp: "#ffa0aa",
  },
  moss: {
    id: "moss",
    label: "Moss",
    bg: "#e7eee6",
    text: "#293b34",
    soft: "#53655a",
    rule: "#becdbf",
    stamp: "#b64450",
  },
};

export const INK_IDS = Object.keys(INKS) as InkId[];

export function isInkId(v: string): v is InkId {
  return INK_IDS.includes(v as InkId);
}
