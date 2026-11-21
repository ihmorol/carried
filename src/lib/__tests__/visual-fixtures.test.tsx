import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";
import { LineCard } from "@/components/LineCard";
import { getBook } from "@/lib/books";
import { encodePayload, type LinePayload } from "@/lib/line";
import { cardPresentation, editionText } from "@/lib/card-presentation";
import { CARD_TEMPLATES } from "@/lib/card-templates";
import { INKS } from "@/lib/inks";
import { layoutEditionArtwork } from "@/lib/text-layout";

const output = process.env.CARRIED_EVIDENCE_DIR;
const enabled = output ? test : test.skip;

enabled("prepares a private browser fixture for real card acceptance", () => {
  const samples = [
    { key: "latin", q: "Fear loses its power when I name it and keep walking.", n: "QA Reader", b: "dune" },
    { key: "bangla", q: "ভয়কে নাম ধরে ডাকলে পথটা একটু সহজ হয়ে যায়।", n: "পাঠক", b: "dune" },
    { key: "latin-limit", q: "M".repeat(220), n: "W".repeat(24), b: "acceptance-book", bt: "W".repeat(90), ba: "M".repeat(60), by: 2026 },
    { key: "bangla-limit", q: "আ".repeat(220), n: "আ".repeat(24), b: "acceptance-book", bt: "আ".repeat(90), ba: "কৌ".repeat(30), by: 2026 },
    { key: "bangla-wide-credit", q: "আ".repeat(220), n: "আ".repeat(24), b: "acceptance-book", bt: "আ".repeat(90), ba: "আ".repeat(60), by: -3000 },
    { key: "mixed", q: "ক্ষুদ্র kindness changes a day. মনে রাখি, then pass it on.", n: "Amara অমরা", b: "acceptance-book", bt: "পথের পাঁচালী", ba: "Bibhutibhushan", by: 1929 },
  ];
  const manifest = samples.flatMap((sample) => CARD_TEMPLATES.flatMap((ct) => (Object.keys(INKS) as LinePayload["s"][]).map((s) => {
    const { key, ...fields } = sample;
    const payload: LinePayload = { v: 1, ...fields, s, d: "2026-11-10", ct };
    const id = encodePayload(payload);
    const content = cardPresentation(payload, getBook(payload.b))!;
    const text = editionText(content, id);
    const layout = layoutEditionArtwork(text, ct);
    expect(layout.credit.top - (layout.quoteY + layout.quote.height)).toBeGreaterThanOrEqual(12);
    expect(layout.author.lines.join("").replace(/\u2060/gu, " ")).toContain(content.year);
    return { key: `${key}-${ct}-${s}`, sample: key, payload, id, expected: { year: content.year, byline: text.byline, layout } };
  })));
  expect(manifest).toHaveLength(samples.length * 9);
  const cards = manifest.map(({ key, payload, id }) => `<section class="case" data-case="${key}"><h2>${key}</h2>${renderToStaticMarkup(createElement(LineCard, { payload, id, book: getBook(payload.b), actions: false }))}</section>`).join("");
  const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");
  const artworkCss = css.slice(css.indexOf(".edition-artwork {"), css.indexOf("/* Vote/actions row:"));
  const fontFaces = [["Manrope", "Manrope"], ["Anek", "AnekBangla"], ["Noto Serif Bengali", "NotoSerifBengali"]].flatMap(([family, file]) =>
    [400, 500, 600].map((weight) => {
      const bytes = readFileSync(join(process.cwd(), "public/fonts", `${file}-${weight}.woff2`));
      return `@font-face{font-family:"${family}";font-weight:${weight};src:url(data:font/woff2;base64,${bytes.toString("base64")}) format("woff2")}`;
    })).join("\n");
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Private Carried acceptance matrix</title><style>
${artworkCss}
.edition-stamp{transform:rotate(var(--edition-stamp-rotation,0deg));transform-origin:center}
${fontFaces}
:root{--font-book:"Noto Serif Bengali";--font-serif:"Noto Serif Bengali",Manrope,Anek,sans-serif;--font-manrope:Manrope;--font-anek-bangla:Anek}body{margin:0;padding:24px;background:#f1f1e7;font-family:Manrope,Anek,sans-serif}.case{width:360px;padding:16px;background:#f1f1e7}.case h2{font:12px Manrope;margin:0 0 12px}.matrix{display:grid;grid-template-columns:repeat(3,392px);gap:12px}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}*,*::before,*::after{box-sizing:border-box}p,blockquote{margin:0}
</style></head><body><div class="matrix">${cards}</div><script>window.__cardCases=${JSON.stringify(manifest).replace(/</g, "\\u003c")}</script></body></html>`;
  mkdirSync(output!, { recursive: true });
  writeFileSync(join(output!, "matrix.html"), html);
  writeFileSync(join(output!, "manifest.json"), JSON.stringify(manifest, null, 2));
});
