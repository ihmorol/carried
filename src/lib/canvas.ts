import { INKS, type Ink } from "./inks";
import type { Book } from "./books";
import { accessionNo, type LinePayload } from "./line";
import {
  EDITION_COPY, EDITION_SHARED_COPY, EDITION_WEIGHTS, cardFontFamily, cardPresentation, type CardScript,
} from "./card-presentation";
import {
  EDITION_ARTWORK, layoutEditionArtwork,
  type EditionLayout, type EditionMeasure, type EditionText, type TextFit,
} from "./text-layout";
import { SITE_NAME } from "./site";

const { width: PW, height: PH, scale: S } = EDITION_ARTWORK;
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

type Ctx = CanvasRenderingContext2D;

function font(script: CardScript, printSize: number, weight: number): string {
  return `${weight} ${printSize * S}px ${cardFontFamily(script, "serif", "canvas")}, sans-serif`;
}

/** Traces the artwork's straight-edge SVG paths (M/H/V/L/Z). */
function tracePath(ctx: Ctx, d: string, unit: number): void {
  const tokens = d.match(/[MHVLZ]|-?(?:\d+\.?\d*|\.\d+)/gi) ?? [];
  let i = 0;
  let x = 0;
  let y = 0;
  let sx = 0;
  let sy = 0;
  const next = () => Number(tokens[i++]) * unit;
  ctx.beginPath();
  while (i < tokens.length) {
    const cmd = tokens[i++].toUpperCase();
    if (cmd === "M") { x = next(); y = next(); sx = x; sy = y; ctx.moveTo(x, y); }
    else if (cmd === "H") { x = next(); ctx.lineTo(x, y); }
    else if (cmd === "V") { y = next(); ctx.lineTo(x, y); }
    else if (cmd === "L") { x = next(); y = next(); ctx.lineTo(x, y); }
    else if (cmd === "Z") { ctx.closePath(); x = sx; y = sy; }
  }
}

type DrawOptions = { script: CardScript; weight: number; color: string; align: CanvasTextAlign };

/** Draws fitted lines at print-space coordinates of the CURRENT transform.
 * Word joiners from the emergency layout render as the spaces they measure. */
function drawFit(ctx: Ctx, fit: TextFit, x: number, y: number, options: DrawOptions): void {
  ctx.fillStyle = options.color;
  ctx.font = font(options.script, fit.fontSize, options.weight);
  ctx.textAlign = options.align;
  fit.lines.forEach((line, index) => {
    const value = line.replace(/[\r\n\u2060]/gu, " ");
    ctx.fillText(options.align === "center" ? value.trim() : value, x * S, (y + index * fit.lineHeight) * S);
  });
}

function drawLabel(ctx: Ctx, value: string, x: number, y: number, options: {
  color: string; align?: CanvasTextAlign; size?: number; weight?: number; script?: CardScript;
}): void {
  ctx.fillStyle = options.color;
  ctx.font = font(options.script ?? "latin", options.size ?? 2.6389, options.weight ?? EDITION_WEIGHTS.label);
  ctx.textAlign = options.align ?? "left";
  ctx.fillText(value, x * S, y * S);
}

const metadataSize = 2.6389; // print px
const smallSize = 2.5;

/** Continuous inline flow of differently-styled words, matching the dense
 * credit's DOM rendering (the label flowing into the title). */
function drawInlineFlow(ctx: Ctx, segments: { text: string; color: string; weight: number }[], x: number, y: number, width: number, size: number, leading: number, align: CanvasTextAlign): void {
  const words = segments.flatMap((segment) => segment.text.split(/\s+/u).filter(Boolean).map((word) => ({ ...segment, word })));
  const widthOf = (value: string, weight: number) => {
    ctx.font = font("latin", size, weight);
    return ctx.measureText(value).width / S;
  };
  const spaceWidth = widthOf(" ", EDITION_WEIGHTS.label);
  const lines: { entries: typeof words; width: number }[] = [];
  let current: { entries: typeof words; width: number } = { entries: [], width: 0 };
  for (const entry of words) {
    const wordWidth = widthOf(entry.word, entry.weight);
    if (current.entries.length && current.width + spaceWidth + wordWidth > width) {
      lines.push(current);
      current = { entries: [], width: 0 };
    }
    if (current.entries.length) current.width += spaceWidth;
    current.entries.push(entry);
    current.width += wordWidth;
  }
  if (current.entries.length) lines.push(current);
  for (const [index, line] of lines.entries()) {
    let cursor = align === "center" ? x - line.width / 2 : x;
    const baseline = y + index * size * leading;
    for (const entry of line.entries) {
      ctx.fillStyle = entry.color;
      ctx.font = font("latin", size, entry.weight);
      ctx.textAlign = "left";
      ctx.fillText(entry.word, cursor * S, baseline * S);
      cursor += widthOf(entry.word, entry.weight) + spaceWidth;
    }
  }
}

function drawBookplate(ctx: Ctx, ink: Ink, text: EditionText, layout: EditionLayout, copy: string): void {
  const shared = EDITION_SHARED_COPY;
  ctx.fillStyle = ink.bg;
  ctx.fillRect(0, 0, PW * S, PH * S);
  ctx.strokeStyle = ink.text;
  ctx.lineWidth = 1.15 * S;
  tracePath(ctx, "M36 14H324V26H338V424H324V436H36V424H22V26H36Z", S); ctx.stroke();
  ctx.lineWidth = 0.55 * S;
  tracePath(ctx, "M42 21H318V33H331V417H318V429H42V417H29V33H42Z", S); ctx.stroke();
  ctx.lineWidth = 0.75 * S;
  tracePath(ctx, "M22 48H13V34M338 48H347V34M22 402H13V416M338 402H347V416", S); ctx.stroke();
  ctx.fillStyle = ink.text;
  tracePath(ctx, "M180 10L184 14L180 18L176 14ZM180 432L184 436L180 440L176 436Z", S); ctx.fill();

  const cx = PW / 2;
  if (layout.dense) {
    // Baseline row: wordmark with the caption beside it, both centered.
    const wordmarkSize = 16;
    const captionSize = smallSize;
    ctx.font = font("latin", wordmarkSize, EDITION_WEIGHTS.wordmark);
    const wmWidth = ctx.measureText(SITE_NAME).width / S;
    ctx.font = font(text.language, captionSize, EDITION_WEIGHTS.label);
    const capWidth = ctx.measureText(copy).width / S;
    const startX = cx - (wmWidth + 8 + capWidth) / 2;
    drawLabel(ctx, SITE_NAME, startX, 23, { color: ink.text, size: wordmarkSize, weight: EDITION_WEIGHTS.wordmark });
    drawLabel(ctx, copy, startX + wmWidth + 8, 23 + 5, { color: ink.soft, script: text.language, size: captionSize });
  } else {
    drawLabel(ctx, SITE_NAME, cx, 30, { color: ink.text, align: "center", size: 20, weight: EDITION_WEIGHTS.wordmark });
    drawLabel(ctx, copy, cx, 55, { color: ink.soft, script: text.language, align: "center", size: 10 });
  }

  drawFit(ctx, layout.quote, layout.quoteInset, layout.quoteTop,
    { script: text.quoteScript, weight: EDITION_WEIGHTS.quote, color: ink.text, align: "center" });

  // Credit block: bottom-anchored 120px above the foot; dense pulls it inline.
  const labelHeight = 12.35;
  if (layout.dense) {
    const flowTop = 314;
    drawInlineFlow(ctx, [
      { text: shared.afterReading[text.language], color: ink.soft, weight: EDITION_WEIGHTS.label },
      { text: text.book, color: ink.text, weight: EDITION_WEIGHTS.book },
    ], cx, flowTop, PW - layout.quoteInset * 2, 8, layout.bookLeading, "center");
    drawFit(ctx, layout.author, cx, flowTop + layout.book.height + 2,
      { script: text.authorScript, weight: EDITION_WEIGHTS.author, color: ink.soft, align: "center" });
  } else {
    const blockHeight = labelHeight + 3 + layout.book.height + layout.author.height;
    const top = PH - 120 - blockHeight;
    drawLabel(ctx, shared.afterReading[text.language], cx, top, { color: ink.soft, align: "center" });
    drawFit(ctx, layout.book, cx, top + labelHeight + 3,
      { script: text.bookScript, weight: EDITION_WEIGHTS.book, color: ink.text, align: "center" });
    drawFit(ctx, layout.author, cx, top + labelHeight + 3 + layout.book.height,
      { script: text.authorScript, weight: EDITION_WEIGHTS.author, color: ink.soft, align: "center" });
  }

  // Oval ownership seal.
  const sealTop = layout.dense ? 376 : 338;
  const sealHeight = layout.dense ? 68 : 86;
  const sealCy = sealTop + sealHeight / 2;
  ctx.strokeStyle = ink.stamp;
  ctx.lineWidth = 1.5 * S;
  ctx.beginPath();
  ctx.ellipse(cx * S, sealCy * S, 114 * S, (sealHeight / 2) * S, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 0.7 * S;
  ctx.beginPath();
  ctx.ellipse(cx * S, sealCy * S, 110 * S, (sealHeight / 2 - 4) * S, 0, 0, Math.PI * 2);
  ctx.stroke();
  const nameRow = layout.dense ? 28 : 42;
  const rows = 13 + 2 + nameRow + 2 + 14;
  const rowsTop = sealTop + (sealHeight - rows) / 2;
  drawLabel(ctx, shared.carriedBy[text.language], cx, rowsTop, { color: ink.stamp, align: "center" });
  drawFit(ctx, layout.name, cx, rowsTop + 15 + (nameRow - layout.name.height) / 2,
    { script: text.nameScript, weight: EDITION_WEIGHTS.name, color: ink.stamp, align: "center" });
  drawLabel(ctx, `${shared.dated[text.language]} ${text.date}`, cx, rowsTop + 15 + nameRow + 2, { color: ink.stamp, align: "center", size: smallSize });

  // Accession under the frame; the dense block sets it vertically on the right.
  if (layout.dense) {
    ctx.save();
    ctx.translate((PW - 22) * S, 88 * S);
    ctx.rotate(Math.PI / 2);
    ctx.fillStyle = ink.soft;
    ctx.font = font("latin", metadataSize, EDITION_WEIGHTS.label);
    ctx.textAlign = "left";
    ctx.fillText(text.accession, 0, 0);
    ctx.restore();
  } else {
    drawLabel(ctx, text.accession, cx, PH - 14 - 12, { color: ink.soft, align: "center" });
  }
}

function drawPoster(ctx: Ctx, ink: Ink, text: EditionText, layout: EditionLayout): void {
  const shared = EDITION_SHARED_COPY;
  const fieldColor = ink.id === "midnight" ? ink.bg : ink.text;
  const textColor = ink.id === "midnight" ? ink.text : ink.bg;
  ctx.fillStyle = fieldColor;
  ctx.fillRect(0, 0, PW * S, PH * S);

  drawLabel(ctx, SITE_NAME, 28, 22, { color: textColor, size: 18, weight: EDITION_WEIGHTS.wordmark });
  drawLabel(ctx, text.accession, PW - 28, 25, { color: textColor, align: "right" });

  drawFit(ctx, layout.quote, layout.quoteInset, layout.quoteTop,
    { script: text.quoteScript, weight: EDITION_WEIGHTS.posterQuote, color: textColor, align: "left" });

  // Credit block, bottom-anchored inside the field.
  const labelHeight = 12.35;
  if (layout.dense) {
    const flowBottom = 363;
    const flowHeight = layout.book.height + 2 + layout.author.height;
    drawInlineFlow(ctx, [
      { text: shared.afterReading[text.language], color: textColor, weight: EDITION_WEIGHTS.label },
      { text: text.book, color: textColor, weight: EDITION_WEIGHTS.book },
    ], 28, flowBottom - flowHeight, PW - 56, 8, layout.bookLeading, "left");
    drawFit(ctx, layout.author, 28, flowBottom - layout.author.height,
      { script: text.authorScript, weight: EDITION_WEIGHTS.author, color: textColor, align: "left" });
  } else {
    const blockHeight = labelHeight + 3 + layout.book.height + layout.author.height;
    const top = 326 - blockHeight;
    drawLabel(ctx, shared.afterReading[text.language], 28, top, { color: textColor });
    drawFit(ctx, layout.book, 28, top + labelHeight + 3,
      { script: text.bookScript, weight: EDITION_WEIGHTS.book, color: textColor, align: "left" });
    drawFit(ctx, layout.author, 28, top + labelHeight + 3 + layout.book.height,
      { script: text.authorScript, weight: EDITION_WEIGHTS.author, color: textColor, align: "left" });
  }

  // Coral printing band with the cropped quotation mark.
  ctx.fillStyle = ink.stamp;
  ctx.fillRect(0, 333 * S, PW * S, (PH - 333) * S);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 333 * S, PW * S, (PH - 333) * S);
  ctx.clip();
  ctx.fillStyle = fieldColor;
  ctx.font = font("latin", 264, EDITION_WEIGHTS.posterQuote);
  ctx.textAlign = "left";
  ctx.fillText("”", 14 * S, 299 * S);
  ctx.restore();

  // Angled ownership stamp over the band edge.
  ctx.save();
  ctx.translate(238 * S, 384 * S);
  ctx.rotate(-6 * Math.PI / 180);
  ctx.fillStyle = ink.bg;
  ctx.fillRect(-102 * S, -44 * S, 204 * S, 88 * S);
  ctx.strokeStyle = ink.stamp;
  ctx.lineWidth = 2 * S;
  ctx.strokeRect(-102 * S, -44 * S, 204 * S, 88 * S);
  ctx.lineWidth = 0.7 * S;
  ctx.strokeRect(-98 * S, -40 * S, 196 * S, 80 * S);
  const rows = 13 + 2 + 42 + 2 + 14;
  const rowsTop = -44 + (88 - rows) / 2;
  drawLabel(ctx, shared.carriedBy[text.language], 0, rowsTop, { color: ink.stamp, align: "center" });
  drawFit(ctx, layout.name, 0, rowsTop + 15 + (42 - layout.name.height) / 2,
    { script: text.nameScript, weight: EDITION_WEIGHTS.name, color: ink.stamp, align: "center" });
  drawLabel(ctx, `${shared.dated[text.language]} ${text.date}`, 0, rowsTop + 15 + 42 + 2, { color: ink.stamp, align: "center", size: smallSize });
  ctx.restore();
}

function ticketStock(ctx: Ctx): void {
  ctx.beginPath();
  ctx.moveTo(12 * S, 0);
  ctx.lineTo(348 * S, 0);
  ctx.arc(360 * S, 12 * S, 12 * S, -Math.PI / 2, 0);
  ctx.lineTo(360 * S, 320 * S);
  ctx.arc(360 * S, 333 * S, 13 * S, -Math.PI / 2, Math.PI / 2, true);
  ctx.lineTo(360 * S, 438 * S);
  ctx.arc(360 * S, 438 * S, 12 * S, 0, Math.PI / 2);
  ctx.lineTo(12 * S, 450 * S);
  ctx.arc(12 * S, 438 * S, 12 * S, Math.PI / 2, Math.PI);
  ctx.lineTo(0, 346 * S);
  ctx.arc(0, 333 * S, 13 * S, Math.PI / 2, -Math.PI / 2, true);
  ctx.lineTo(0, 12 * S);
  ctx.arc(12 * S, 12 * S, 12 * S, Math.PI, Math.PI * 1.5);
  ctx.closePath();
}

function ticketStub(ctx: Ctx): void {
  ctx.beginPath();
  ctx.moveTo(13 * S, 333 * S);
  ctx.lineTo(347 * S, 333 * S);
  ctx.arc(360 * S, 346 * S, 13 * S, -Math.PI / 2, 0);
  ctx.lineTo(360 * S, 438 * S);
  ctx.arc(360 * S, 438 * S, 12 * S, 0, Math.PI / 2);
  ctx.lineTo(12 * S, 450 * S);
  ctx.arc(12 * S, 438 * S, 12 * S, Math.PI / 2, Math.PI);
  ctx.lineTo(0, 346 * S);
  ctx.arc(0, 333 * S, 13 * S, Math.PI / 2, 0, true);
  ctx.closePath();
}

function drawTicket(ctx: Ctx, ink: Ink, text: EditionText, layout: EditionLayout, copy: string): void {
  const shared = EDITION_SHARED_COPY;
  // Die-cut stock with its contrasting stub.
  ticketStock(ctx);
  ctx.fillStyle = ink.bg;
  ctx.fill();
  ctx.strokeStyle = ink.rule;
  ctx.lineWidth = 0.8 * S;
  ctx.stroke();
  ticketStub(ctx);
  ctx.fillStyle = ink.text;
  ctx.fill();

  ctx.strokeStyle = ink.bg;
  ctx.lineWidth = 1.5 * S;
  ctx.setLineDash([3 * S, 4 * S]);
  ctx.beginPath();
  ctx.moveTo(19 * S, 333 * S);
  ctx.lineTo(341 * S, 333 * S);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = ink.rule;
  ctx.lineWidth = 0.7 * S;
  tracePath(ctx, "M18 7H342M353 18V312M7 18V312M18 443H342", S);
  ctx.stroke();

  const headingTop = layout.dense ? 12 : 22;
  drawLabel(ctx, SITE_NAME, 30, headingTop, { color: ink.text, size: 18, weight: EDITION_WEIGHTS.wordmark });
  drawLabel(ctx, text.accession, PW - 30, headingTop + 3, { color: ink.text, align: "right" });
  ctx.strokeStyle = ink.rule;
  ctx.lineWidth = 1 * S;
  ctx.beginPath();
  ctx.moveTo(30 * S, (headingTop + 33) * S);
  ctx.lineTo((PW - 30) * S, (headingTop + 33) * S);
  ctx.stroke();

  drawLabel(ctx, copy, 30, layout.dense ? 311 : 67, { color: ink.stamp, size: layout.dense ? smallSize : 12 });

  drawFit(ctx, layout.quote, layout.quoteInset, layout.quoteTop,
    { script: text.quoteScript, weight: EDITION_WEIGHTS.ticketQuote, color: ink.text, align: "left" });

  const datelineTop = layout.dense ? 304 : 300;
  drawLabel(ctx, `${shared.dated[text.language]} ${text.date}`, 30, datelineTop, { color: ink.soft, size: smallSize });
  drawLabel(ctx, shared.languageName[text.language], PW - 30, datelineTop, { color: ink.soft, align: "right", size: 10 });

  // Stub: book credit beside the circular cancellation.
  const labelHeight = 12.35;
  const blockHeight = labelHeight + 3 + layout.book.height + layout.author.height;
  const creditTop = 333 + (117 - blockHeight) / 2;
  drawLabel(ctx, shared.afterReading[text.language], 27, creditTop, { color: ink.bg });
  drawFit(ctx, layout.book, 27, creditTop + labelHeight + 3,
    { script: text.bookScript, weight: EDITION_WEIGHTS.book, color: ink.bg, align: "left" });
  drawFit(ctx, layout.author, 27, creditTop + labelHeight + 3 + layout.book.height,
    { script: text.authorScript, weight: EDITION_WEIGHTS.author, color: ink.bg, align: "left" });
  ctx.save();
  ctx.globalAlpha = 0.4;
  ctx.strokeStyle = ink.bg;
  ctx.lineWidth = 1 * S;
  ctx.setLineDash([2 * S, 2 * S]);
  ctx.beginPath();
  ctx.moveTo(236 * S, 337 * S);
  ctx.lineTo(236 * S, 446 * S);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // Circular cancellation, drawn from the board's 132 × 112 viewBox.
  const cancelCy = 333 + 117 / 2;
  ctx.save();
  ctx.translate(296 * S, cancelCy * S);
  ctx.rotate(-5 * Math.PI / 180);
  const k = 30 / 132;
  ctx.save();
  ctx.translate(-66 * k * S, -56 * k * S);
  ctx.scale(k * S, k * S);
  ctx.beginPath();
  ctx.arc(66, 56, 50, 0, Math.PI * 2);
  ctx.fillStyle = ink.bg;
  ctx.fill();
  ctx.strokeStyle = ink.stamp;
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(66, 56, 45, 0, Math.PI * 2);
  ctx.lineWidth = 0.7;
  ctx.stroke();
  ctx.lineWidth = 1;
  tracePath(ctx, "M0 43H10M0 49H10M0 55H10M122 57H132M122 63H132M122 69H132", 1);
  ctx.stroke();
  ctx.restore();
  const rows = 13 + 3 + 54;
  const rowsTop = -100.8 / 2 + (100.8 - rows) / 2;
  drawLabel(ctx, shared.carriedBy[text.language], 0, rowsTop, { color: ink.stamp, align: "center" });
  drawFit(ctx, layout.name, 0, rowsTop + 16 + (54 - layout.name.height) / 2,
    { script: text.nameScript, weight: EDITION_WEIGHTS.name, color: ink.stamp, align: "center" });
  ctx.restore();
}

export async function exportLineCard(payload: LinePayload, id: string, book?: Book): Promise<Blob> {
  const ink = INKS[payload.s];
  const content = cardPresentation(payload, book);
  if (!content) throw new Error("Book not found");
  await loadCanvasFonts();
  const canvas = document.createElement("canvas");
  canvas.width = PW * S;
  canvas.height = PH * S;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.letterSpacing = "0px";
  ctx.textBaseline = "top";

  const quoteWeight = content.edition === "poster-v1" ? EDITION_WEIGHTS.posterQuote
    : content.edition === "ticket-v1" ? EDITION_WEIGHTS.ticketQuote : EDITION_WEIGHTS.quote;
  const roleStyle = (role: Parameters<EditionMeasure>[0]): { script: CardScript; weight: number } => {
    if (role === "quote") return { script: content.quoteScript, weight: quoteWeight };
    if (role === "name") return { script: content.nameScript, weight: EDITION_WEIGHTS.name };
    if (role === "book") return { script: content.titleScript, weight: EDITION_WEIGHTS.book };
    if (role === "date") return { script: content.dateScript, weight: EDITION_WEIGHTS.label };
    return { script: content.authorScript, weight: EDITION_WEIGHTS.author };
  };
  const measure: EditionMeasure = (role, value, size) => {
    const { script, weight } = roleStyle(role);
    ctx.font = font(script, size, weight);
    return ctx.measureText(value).width / S;
  };
  const text: EditionText = {
    quote: content.quote,
    name: content.name,
    book: content.title,
    author: content.author,
    date: content.date,
    accession: accessionNo(id),
    language: content.quoteScript,
    quoteScript: content.quoteScript,
    nameScript: content.nameScript,
    bookScript: content.titleScript,
    authorScript: content.authorScript,
    dateScript: content.dateScript,
  };
  const layout = layoutEditionArtwork(text, content.edition, measure);
  const copy = EDITION_COPY[content.edition][content.quoteScript];
  if (content.edition === "bookplate-v1") drawBookplate(ctx, ink, text, layout, copy);
  else if (content.edition === "poster-v1") drawPoster(ctx, ink, text, layout);
  else drawTicket(ctx, ink, text, layout, copy);
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
