import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { CardFont } from "./card-fonts";

export type FontData = {
  name: string;
  data: Buffer;
  weight: 400 | 500 | 600 | 700;
  style: "normal" | "italic";
};

/**
 * Read the TTFs we ship for satori. Node runtime only. Pass the card's
 * typeface to add just that face, the rest are never read.
 */
export function loadOgFonts(cardFont?: CardFont): FontData[] {
  const dir = join(process.cwd(), "public", "fonts");
  const file = (name: string) => readFileSync(join(dir, name));
  const extra: FontData[] = [];
  if (cardFont && cardFont.id !== "fraunces") {
    const specs = cardFont.quote.file === cardFont.name.file ? [cardFont.quote] : [cardFont.quote, cardFont.name];
    for (const f of specs) extra.push({ name: cardFont.family, data: file(f.file), weight: f.weight, style: f.style });
  }
  return [
    ...extra,
    { name: "Fraunces", data: file("Fraunces-500.ttf"), weight: 500, style: "normal" },
    { name: "Fraunces", data: file("Fraunces-600.ttf"), weight: 600, style: "normal" },
    { name: "Fraunces", data: file("Fraunces-Italic-500.ttf"), weight: 500, style: "italic" },
    { name: "Plex", data: file("IBMPlexMono-400.ttf"), weight: 400, style: "normal" },
    { name: "Plex", data: file("IBMPlexMono-500.ttf"), weight: 500, style: "normal" },
    { name: "Plex", data: file("IBMPlexMono-600.ttf"), weight: 600, style: "normal" },
    { name: "Noto Serif Bengali", data: file("NotoSerifBengali-500.ttf"), weight: 500, style: "normal" },
    { name: "Noto Serif Bengali", data: file("NotoSerifBengali-600.ttf"), weight: 600, style: "normal" },
    { name: "Noto Serif Bengali", data: file("NotoSerifBengali-700.ttf"), weight: 700, style: "normal" },
    { name: "Noto Sans Bengali", data: file("NotoSansBengali-400.ttf"), weight: 400, style: "normal" },
    { name: "Noto Sans Bengali", data: file("NotoSansBengali-500.ttf"), weight: 500, style: "normal" },
    { name: "Noto Sans Bengali", data: file("NotoSansBengali-600.ttf"), weight: 600, style: "normal" },
  ];
}
