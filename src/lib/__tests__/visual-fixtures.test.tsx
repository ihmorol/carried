import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { test } from "vitest";
import { LineCard } from "@/components/LineCard";
import { getBook } from "@/lib/books";
import { encodePayload, type LinePayload } from "@/lib/line";

const output = process.env.CARRIED_EVIDENCE_DIR;
const enabled = output ? test : test.skip;

enabled("prepares a private browser fixture for real card acceptance", () => {
  const samples = [
    { key: "latin", q: "Fear loses its power when I name it and keep walking.", n: "QA Reader", b: "dune" },
    { key: "bangla", q: "ভয়কে নাম ধরে ডাকলে পথটা একটু সহজ হয়ে যায়।", n: "পাঠক", b: "dune" },
    { key: "latin-limit", q: "M".repeat(220), n: "W".repeat(24), b: "acceptance-book", bt: "W".repeat(90), ba: "M".repeat(60), by: 2026 },
    { key: "bangla-limit", q: "আ".repeat(220), n: "আ".repeat(24), b: "acceptance-book", bt: "আ".repeat(90), ba: "কৌ".repeat(30), by: 2026 },
    { key: "mixed", q: "ক্ষুদ্র kindness changes a day. মনে রাখি, then pass it on.", n: "Amara অমরা", b: "acceptance-book", bt: "পথের পাঁচালী", ba: "Bibhutibhushan", by: 1929 },
  ];
  const manifest = samples.flatMap((sample) => (["bookplate-v1", "poster-v1", "ticket-v1"] as const).flatMap((ct) => (["paper", "midnight", "moss"] as const).map((s) => {
    const { key, ...fields } = sample;
    const payload: LinePayload = { v: 1, ...fields, s, d: "2026-11-10", ct };
    const id = encodePayload(payload);
    return { key: `${key}-${ct}-${s}`, sample: key, payload, id };
  })));
  const cards = manifest.map(({ key, payload, id }) => `<section class="case" data-case="${key}"><h2>${key}</h2>${renderToStaticMarkup(createElement(LineCard, { payload, id, book: getBook(payload.b), actions: false }))}</section>`).join("");
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Private Carried acceptance matrix</title><style>
@font-face{font-family:Manrope;src:url(http://127.0.0.1:3100/fonts/Manrope-400.woff2);font-weight:400}@font-face{font-family:Manrope;src:url(http://127.0.0.1:3100/fonts/Manrope-500.woff2);font-weight:500}@font-face{font-family:Manrope;src:url(http://127.0.0.1:3100/fonts/Manrope-600.woff2);font-weight:600}
@font-face{font-family:Anek;src:url(http://127.0.0.1:3100/fonts/AnekBangla-400.woff2);font-weight:400}@font-face{font-family:Anek;src:url(http://127.0.0.1:3100/fonts/AnekBangla-500.woff2);font-weight:500}@font-face{font-family:Anek;src:url(http://127.0.0.1:3100/fonts/AnekBangla-600.woff2);font-weight:600}
:root{--font-manrope:Manrope;--font-anek-bangla:Anek}body{margin:0;padding:24px;background:#f1f1e7;font-family:Manrope,Anek,sans-serif}.case{width:360px;padding:16px;background:#f1f1e7}.case h2{font:12px Manrope;margin:0 0 12px}.matrix{display:grid;grid-template-columns:repeat(3,392px);gap:12px}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}*,*::before,*::after{box-sizing:border-box}p,blockquote{margin:0}
</style></head><body><div class="matrix">${cards}</div><script>window.__cardCases=${JSON.stringify(manifest).replace(/</g, "\\u003c")}</script></body></html>`;
  mkdirSync(output!, { recursive: true });
  writeFileSync(join(output!, "matrix.html"), html);
  writeFileSync(join(output!, "manifest.json"), JSON.stringify(manifest, null, 2));
});
