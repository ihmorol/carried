import { INKS } from "./inks";
import type { Book } from "./books";
import { accessionNo, type LinePayload } from "./line";
import { cardFontFamily, cardPresentation, type CardScript } from "./card-presentation";
import { CARD_REGIONS, fitText, layoutCardText, type TextFit } from "./text-layout";
import { SITE_NAME } from "./site";

const W = 1080;
const H = 1350;
const M = 92;
const fontLoads = new Map<string, Promise<void>>();

/** FontFaceSet.check is not registration evidence: it also returns true
 * when the requested face does not exist. Cache our explicit load instead.
 * Rejections are evicted so Save the card can retry after a failed request. */
export function loadCanvasFont(family: string, file: string, weight: string, style: string): Promise<void> {
  if (typeof document === "undefined") return Promise.reject(new Error("Canvas fonts require a browser"));
  const key = `${family}/${file}/${weight}/${style}`;
  const cached = fontLoads.get(key);
  if (cached) return cached;
  const pending = Promise.resolve().then(async () => {
    const face = new FontFace(family, `url(/fonts/${file})`, { weight, style });
    const loaded = await face.load();
    document.fonts.add(loaded);
  }).catch((error: unknown) => { fontLoads.delete(key); throw error; });
  fontLoads.set(key, pending);
  return pending;
}

export async function loadCanvasFonts(): Promise<void> {
  await Promise.all([
    loadCanvasFont("Fraunces Export", "Fraunces-500.ttf", "500", "normal"),
    loadCanvasFont("Fraunces Export", "Fraunces-600.ttf", "600", "normal"),
    loadCanvasFont("Fraunces Export", "Fraunces-Italic-500.ttf", "500", "italic"),
    ...[400, 500, 600].map((weight) => loadCanvasFont("Plex Export", `IBMPlexMono-${weight}.ttf`, String(weight), "normal")),
    ...[500, 600].map((weight) => loadCanvasFont("Noto Serif Bengali Export", `NotoSerifBengali-${weight}.ttf`, String(weight), "normal")),
    ...[400, 500, 600].map((weight) => loadCanvasFont("Noto Sans Bengali Export", `NotoSansBengali-${weight}.ttf`, String(weight), "normal")),
  ]);
  await document.fonts.ready;
}

function font(script: CardScript, role: "serif" | "mono", size: number, weight: number, italic = false) {
  return `${italic && script === "latin" ? "italic " : ""}${weight} ${size}px ${cardFontFamily(script, role, "canvas")}`;
}

export async function exportLineCard(payload: LinePayload, id: string, book?: Book): Promise<Blob> {
  const ink = INKS[payload.s];
  const content = cardPresentation(payload, book);
  if (!content) throw new Error("Book not found");
  await loadCanvasFonts();
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  const families = {
    quote: (size: number) => font(content.quoteScript, "serif", size, 500, true),
    title: (size: number) => font(content.titleScript, "serif", size, 600),
    byline: (size: number) => font(content.authorScript, "mono", size, 400),
    name: (size: number) => font(content.nameScript, "serif", size, 600),
  };
  ctx.letterSpacing = "0px";
  const layout = layoutCardText(content, "png", (role, text, size) => {
    ctx.font = families[role](size);
    return ctx.measureText(text).width;
  });
  const regions = CARD_REGIONS.png;
  const text = (fit: TextFit, x: number, y: number, type: (size: number) => string) => {
    ctx.font = type(fit.fontSize);
    fit.lines.forEach((line, index) => ctx.fillText(line.replace(/[\r\n]/g, ""), x, y + index * fit.lineHeight));
  };
  ctx.fillStyle = ink.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = ink.rule;
  ctx.lineWidth = 2;
  ctx.strokeRect(58, 58, W - 116, H - 116);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(70, 70, W - 140, H - 140);
  ctx.textBaseline = "top";
  ctx.fillStyle = ink.text;
  ctx.font = font("latin", "mono", 22, 600);
  ctx.letterSpacing = "7px";
  ctx.fillText(SITE_NAME.toUpperCase(), M, M);
  ctx.textAlign = "right";
  ctx.fillStyle = ink.soft;
  ctx.fillText(`No. ${accessionNo(id)}`, W - M, M);
  ctx.textAlign = "left";
  ctx.letterSpacing = "0px";
  if (content.quoteScript === "latin") {
    ctx.fillStyle = ink.rule;
    ctx.font = font("latin", "serif", 132, 500, true);
    ctx.fillText("“", M - 10, 140);
  }
  ctx.fillStyle = ink.text;
  text(layout.quote, regions.quote.x, regions.quote.y, families.quote);
  ctx.strokeStyle = ink.rule;
  ctx.beginPath(); ctx.moveTo(M, 810); ctx.lineTo(W - M, 810); ctx.stroke();
  ctx.fillStyle = ink.soft;
  ctx.font = font("latin", "mono", 18, 600);
  ctx.letterSpacing = "6px";
  ctx.fillText("CARRIED OUT OF", M, 823);
  ctx.letterSpacing = "0px";
  ctx.fillStyle = ink.text;
  text(layout.title, regions.title.x, regions.title.y, families.title);
  ctx.fillStyle = ink.soft;
  text(layout.byline, regions.byline.x, regions.byline.y, families.byline);

  const stamp = regions.stamp;
  ctx.save();
  ctx.translate(stamp.x + stamp.width / 2, stamp.y + stamp.height / 2);
  ctx.rotate(-6.5 * Math.PI / 180);
  ctx.strokeStyle = ink.stamp; ctx.fillStyle = ink.stamp; ctx.lineWidth = 5;
  ctx.strokeRect(-stamp.width / 2, -stamp.height / 2, stamp.width, stamp.height);
  ctx.textAlign = "center";
  ctx.font = font("latin", "mono", 18, 600);
  ctx.letterSpacing = "5px";
  ctx.fillText("CARRIED BY", 0, -stamp.height / 2 + 14);
  ctx.letterSpacing = "0px";
  text(layout.name, 0, -stamp.height / 2 + 42 + (regions.name.height - layout.name.height) / 2, families.name);
  const dateFit = fitText(content.date, { width: stamp.width - 40, height: 28, maxFontSize: 16, minFontSize: 13,
    leading: 1.65, measure: (value, size) => { ctx.font = font(content.dateScript, "mono", size, 500); return ctx.measureText(value).width; } });
  text(dateFit, 0, stamp.height / 2 - 35, (size) => font(content.dateScript, "mono", size, 500));
  ctx.restore();
  ctx.textAlign = "left";
  ctx.fillStyle = ink.soft;
  ctx.font = font("latin", "mono", 16, 400);
  ctx.letterSpacing = "2px";
  ctx.fillText(`${SITE_NAME.toUpperCase()}, THE LINE A BOOK LEFT IN YOU`, M, 1298);
  ctx.letterSpacing = "0px";
  return new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Export failed")), "image/png"));
}

export async function downloadLineCard(payload: LinePayload, id: string, book?: Book): Promise<void> {
  const blob = await exportLineCard(payload, id, book);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `carried-${accessionNo(id).toLowerCase()}.png`;
  document.body.appendChild(a);
  a.click(); a.remove(); URL.revokeObjectURL(url);
}

export async function lineCardBlob(payload: LinePayload, id: string, book?: Book): Promise<Blob | null> {
  try { return await exportLineCard(payload, id, book); } catch { return null; }
}
