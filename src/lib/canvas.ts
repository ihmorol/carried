import { INKS } from "./inks";
import type { Book } from "./books";
import { accessionNo, type LinePayload } from "./line";
import { CARD_WEIGHTS, cardFontFamily, cardPresentation, type CardScript } from "./card-presentation";
import { CARD_SURFACES, layoutCardText, type CardRegion, type TextFit } from "./text-layout";
import { SITE_NAME } from "./site";

const { width: W, height: H, scale } = CARD_SURFACES.png;
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
    ...[400, 500, 600].map((weight) => loadCanvasFont("Manrope Export", `Manrope-${weight}.ttf`, String(weight), "normal")),
    ...[400, 500, 600].map((weight) => loadCanvasFont("Anek Bangla Export", `AnekBangla-${weight}.ttf`, String(weight), "normal")),
  ]);
  await document.fonts.ready;
}

function font(script: CardScript, size: number, weight: number) {
  return `${weight} ${size}px ${cardFontFamily(script, "serif", "canvas")}, sans-serif`;
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
    quote: (size: number) => font(content.quoteScript, size, CARD_WEIGHTS.quote),
    title: (size: number) => font(content.titleScript, size, CARD_WEIGHTS.title),
    byline: (size: number) => font(content.authorScript, size, CARD_WEIGHTS.byline),
    name: (size: number) => font(content.nameScript, size, CARD_WEIGHTS.name),
    date: (size: number) => font(content.dateScript, size, CARD_WEIGHTS.date),
  };
  ctx.letterSpacing = "0px";
  const layout = layoutCardText(content, "png", (role, text, size) => {
    ctx.font = families[role](size);
    return ctx.measureText(text).width;
  });
  const { regions, metadata } = layout;
  const text = (fit: TextFit, region: CardRegion, type: (size: number) => string, right = false) => {
    ctx.font = type(fit.fontSize);
    ctx.textAlign = right ? "right" : "left";
    fit.lines.forEach((line, index) => ctx.fillText(line.replace(/[\r\n]/g, ""), region.x + (right ? region.width : 0), region.y + index * fit.lineHeight));
  };
  const border = (x: number, y: number, width: number, height: number, radius: number) => {
    ctx.beginPath(); ctx.roundRect(x, y, width, height, radius); ctx.stroke();
  };
  ctx.fillStyle = ink.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = ink.rule;
  ctx.lineWidth = scale;
  border(12 * scale, 12 * scale, W - 24 * scale, H - 24 * scale, 12 * scale);
  ctx.lineWidth = scale;
  border(16 * scale, 16 * scale, W - 32 * scale, H - 32 * scale, 8 * scale);
  ctx.textBaseline = "top";
  ctx.fillStyle = ink.text;
  ctx.font = font("latin", metadata.fontSize, CARD_WEIGHTS.metadata);
  ctx.fillText(SITE_NAME, regions.header.x, regions.header.y);
  ctx.textAlign = "right";
  ctx.fillStyle = ink.soft;
  ctx.fillText(`No. ${accessionNo(id)}`, regions.header.x + regions.header.width, regions.header.y);
  ctx.textAlign = "left";
  ctx.fillStyle = ink.text;
  text(layout.quote, regions.quote, families.quote);
  ctx.fillStyle = ink.soft;
  ctx.font = font("latin", metadata.fontSize, CARD_WEIGHTS.metadata);
  ctx.fillText("Carried out of", regions.provenance.x, regions.provenance.y);
  ctx.fillStyle = ink.text;
  text(layout.title, regions.title, families.title);
  ctx.fillStyle = ink.soft;
  text(layout.byline, regions.byline, families.byline);

  const stamp = regions.stamp;
  ctx.strokeStyle = ink.stamp;
  ctx.fillStyle = ink.stamp;
  ctx.lineWidth = scale;
  border(stamp.x, stamp.y, stamp.width, stamp.height, 6 * scale);
  ctx.font = font("latin", metadata.fontSize, CARD_WEIGHTS.metadata);
  ctx.fillText("Carried by", regions.stampLabel.x, regions.stampLabel.y);
  text(layout.name, regions.name, families.name);
  text(layout.date, regions.date, families.date, true);
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
