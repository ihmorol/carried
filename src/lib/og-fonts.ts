import { readFileSync } from "node:fs";
import { join } from "node:path";

export type FontData = {
  name: string;
  data: Buffer;
  weight: 400 | 500 | 600;
  style: "normal" | "italic";
};

/** Read the TTFs we ship for satori. Node runtime only. */
export function loadOgFonts(): FontData[] {
  const dir = join(process.cwd(), "public", "fonts");
  const file = (name: string) => readFileSync(join(dir, name));
  return [
    { name: "Fraunces", data: file("Fraunces-500.ttf"), weight: 500, style: "normal" },
    { name: "Fraunces", data: file("Fraunces-600.ttf"), weight: 600, style: "normal" },
    { name: "Fraunces", data: file("Fraunces-Italic-500.ttf"), weight: 500, style: "italic" },
    { name: "Plex", data: file("IBMPlexMono-400.ttf"), weight: 400, style: "normal" },
    { name: "Plex", data: file("IBMPlexMono-500.ttf"), weight: 500, style: "normal" },
    { name: "Plex", data: file("IBMPlexMono-600.ttf"), weight: 600, style: "normal" },
  ];
}
