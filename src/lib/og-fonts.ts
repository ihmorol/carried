import { readFileSync } from "node:fs";
import { join } from "node:path";

export type FontData = {
  name: string;
  data: Buffer;
  weight: 400 | 500 | 600 | 700;
  style: "normal" | "italic";
};

let cachedFonts: FontData[] | undefined;

/** Read the shipped TTFs once per Node process, never fetch remote fonts. */
export function loadOgFonts(): FontData[] {
  if (cachedFonts) return cachedFonts;
  const dir = join(process.cwd(), "public", "fonts");
  const file = (name: string) => readFileSync(join(dir, name));
  cachedFonts = [
    ...([400, 500, 600] as const).map((weight) => ({ name: "Noto Serif Bengali", data: file(`NotoSerifBengali-${weight}.ttf`), weight, style: "normal" as const })),
    ...([400, 500, 600] as const).map((weight) => ({ name: "Manrope", data: file(`Manrope-${weight}.ttf`), weight, style: "normal" as const })),
    ...([400, 500, 600] as const).map((weight) => ({ name: "Anek Bangla", data: file(`AnekBangla-${weight}.ttf`), weight, style: "normal" as const })),
  ];
  return cachedFonts;
}
