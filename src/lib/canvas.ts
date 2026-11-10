import { INKS, type Ink } from "./inks";
import type { Book } from "./books";
import { accessionNo, type LinePayload } from "./line";
import {
  EDITION_COPY, EDITION_SHARED_COPY, EDITION_WEIGHTS, cardFontFamily, cardPresentation, editionText, type CardScript,
} from "./card-presentation";
import { EDITION_ARTWORK, layoutEditionArtwork, type EditionLayout, type EditionText, type TextFit } from "./text-layout";
import { SITE_NAME } from "./site";

const { width: PW, height: PH, scale: S } = EDITION_ARTWORK;
const fontLoads = new Map<string, Promise<void>>();

/** Register the real faces before measuring. A failed request can be retried. */
export function loadCanvasFont(family: string, file: string, weight: string, style: string): Promise<void> {
  if (typeof document === "undefined") return Promise.reject(new Error("Canvas fonts require a browser"));
  const key = `${family}/${file}/${weight}/${style}`;
  const cached = fontLoads.get(key);
  if (cached) return cached;
  const pending = Promise.resolve().then(async () => {
    const face = new FontFace(family, `url(/fonts/${file})`, { weight, style });
    document.fonts.add(await face.load());
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
const font = (script: CardScript, size: number, weight: number) => `${weight} ${size * S}px ${cardFontFamily(script, "serif", "canvas")}, sans-serif`;

/** Traces the straight-edge frame paths in their own coordinate system. */
function tracePath(ctx: Ctx, d: string, unit: number): void {
  const tokens = d.match(/[MHVLZ]|-?(?:\d+\.?\d*|\.\d+)/gi) ?? [];
  let i = 0, x = 0, y = 0, sx = 0, sy = 0;
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

type DrawOptions = { script: CardScript; weight: number; color: string; align?: CanvasTextAlign };

/** Paint the same line boxes as the DOM, with the loaded face's baseline.
 * Refitting here would change the card's line breaks after the reader saves it. */
function drawFit(ctx: Ctx, fit: TextFit, x: number, y: number, options: DrawOptions): void {
  ctx.fillStyle = options.color;
  ctx.font = font(options.script, fit.fontSize, options.weight);
  ctx.textAlign = options.align ?? "left";
  ctx.textBaseline = "alphabetic";
  fit.lines.forEach((line, index) => {
    const value = line.replace(/[\r\n\u2060]/gu, " ").trim();
    const metrics = ctx.measureText(value);
    const ascent = metrics.fontBoundingBoxAscent ?? fit.fontSize * S * 0.8;
    const descent = metrics.fontBoundingBoxDescent ?? fit.fontSize * S * 0.2;
    const baseline = (fit.lineHeight * S - ascent - descent) / 2 + ascent;
    ctx.fillText(value, x * S, (y + index * fit.lineHeight) * S + baseline);
  });
}

function drawLabel(ctx: Ctx, value: string, x: number, y: number, options: Partial<DrawOptions> & { color: string; size?: number; leading?: number }): void {
  const size = options.size ?? 11;
  const lineHeight = size * (options.leading ?? 1.3);
  drawFit(ctx, { lines: [value], fontSize: size, lineHeight, height: lineHeight }, x, y,
    { script: options.script ?? "latin", weight: options.weight ?? EDITION_WEIGHTS.label, color: options.color, align: options.align });
}

function drawCredit(ctx: Ctx, ink: Ink, text: EditionText, layout: EditionLayout, edition: "bookplate" | "poster" | "ticket"): void {
  const center = edition === "bookplate";
  const x = center ? PW / 2 : layout.credit.inset;
  const color = edition === "ticket" ? ink.bg : edition === "poster" && ink.id !== "midnight" ? ink.bg : ink.text;
  const soft = edition === "bookplate" ? ink.soft : color;
  const align = center ? "center" : "left";
  const top = layout.credit.top;
  drawLabel(ctx, EDITION_SHARED_COPY.afterReading[text.language], x, top,
    { color: soft, script: text.language, align, size: layout.dense ? 8 : 11 });
  const bookTop = top + layout.credit.labelHeight + layout.credit.gap;
  drawFit(ctx, layout.book, x, bookTop, { script: text.bookScript, weight: EDITION_WEIGHTS.book, color, align });
  drawFit(ctx, layout.author, x, bookTop + layout.book.height, { script: text.authorScript, weight: EDITION_WEIGHTS.author, color: soft, align });
}

/** Rows of the ownership stack in print space: label, name, then the
 * optional coral signature rule, then the date. Mirrors the DOM grid. */
function ownershipBlockHeight(layout: EditionLayout, withRule: boolean): number {
  const dateHeight = 14, ruleHeight = withRule ? 1.5 : 0;
  const gaps = layout.ownership.gap * (withRule ? 3 : 2);
  return 14.3 + layout.ownership.nameHeight + dateHeight + ruleHeight + gaps;
}

function drawOwnershipRows(ctx: Ctx, ink: Ink, text: EditionText, layout: EditionLayout, x: number, rowsTop: number,
  align: "center" | "left", withRule: boolean, colors: { label: string; name: string; date: string }): void {
  drawLabel(ctx, EDITION_SHARED_COPY.carriedBy[text.language], x, rowsTop,
    { color: colors.label, script: text.language, align });
  drawFit(ctx, layout.name, x, rowsTop + 14.3 + layout.ownership.gap + (layout.ownership.nameHeight - layout.name.height) / 2,
    { script: text.nameScript, weight: EDITION_WEIGHTS.name, color: colors.name, align });
  let ruleTop = 0;
  if (withRule) {
    ruleTop = rowsTop + 14.3 + layout.ownership.gap + layout.ownership.nameHeight + layout.ownership.gap;
    ctx.fillStyle = ink.stamp;
    ctx.fillRect((x - 28) * S, ruleTop * S, 56 * S, 1.5 * S);
  }
  const dateTop = withRule
    ? ruleTop + 1.5 + layout.ownership.gap
    : rowsTop + 14.3 + layout.ownership.gap + layout.ownership.nameHeight + layout.ownership.gap;
  drawLabel(ctx, `${EDITION_SHARED_COPY.dated[text.language]} ${text.date}`, x, dateTop,
    { color: colors.date, script: text.dateScript, align, size: 10, leading: 1.4 });
}

function drawBookplate(ctx: Ctx, ink: Ink, text: EditionText, layout: EditionLayout, copy: string): void {
  ctx.fillStyle = ink.bg;
  ctx.fillRect(0, 0, PW * S, PH * S);
  // The whole frame is one hairline plate rule.
  ctx.strokeStyle = ink.text;
  ctx.lineWidth = 0.75 * S;
  ctx.strokeRect(13.5 * S, 13.5 * S, 333 * S, 423 * S);

  const cx = PW / 2;
  if (layout.dense) {
    drawLabel(ctx, SITE_NAME, 36, 23, { color: ink.text, size: 16, weight: EDITION_WEIGHTS.wordmark, leading: 1.1 });
    drawLabel(ctx, copy, 324, 27, { color: ink.soft, script: text.language, size: 9, align: "right", leading: 1.4 });
  } else {
    drawLabel(ctx, SITE_NAME, cx, 30, { color: ink.text, align: "center", size: 20, weight: EDITION_WEIGHTS.wordmark, leading: 1.1 });
    drawLabel(ctx, copy, cx, 55, { color: ink.soft, script: text.language, align: "center", size: 11, leading: 1.4 });
  }
  drawFit(ctx, layout.quote, cx, layout.quoteY, { script: text.quoteScript, weight: EDITION_WEIGHTS.quote, color: ink.text, align: "center" });
  drawCredit(ctx, ink, text, layout, "bookplate");

  const { top, height } = layout.ownership;
  const rowsTop = top + (height - ownershipBlockHeight(layout, true)) / 2;
  drawOwnershipRows(ctx, ink, text, layout, cx, rowsTop, "center", true,
    { label: ink.soft, name: ink.text, date: ink.soft });
  if (layout.dense) {
    ctx.save(); ctx.translate(338 * S, 88 * S); ctx.rotate(Math.PI / 2);
    drawLabel(ctx, text.accession, 0, 0, { color: ink.soft, size: 9 }); ctx.restore();
  } else drawLabel(ctx, text.accession, cx, 425, { color: ink.soft, align: "center", size: 10 });
}

function drawPoster(ctx: Ctx, ink: Ink, text: EditionText, layout: EditionLayout): void {
  const fieldColor = ink.id === "midnight" ? ink.bg : ink.text;
  const textColor = ink.id === "midnight" ? ink.text : ink.bg;
  ctx.fillStyle = fieldColor;
  ctx.fillRect(0, 0, PW * S, PH * S);
  drawLabel(ctx, SITE_NAME, 28, layout.dense ? 12 : 22, { color: textColor, size: 18, weight: EDITION_WEIGHTS.wordmark, leading: 1.2 });
  drawLabel(ctx, text.accession, PW - 28, layout.dense ? 16 : 26, { color: textColor, size: 10, align: "right" });
  drawFit(ctx, layout.quote, layout.quoteInset, layout.quoteY, { script: text.quoteScript, weight: EDITION_WEIGHTS.posterQuote, color: textColor });
  drawCredit(ctx, ink, text, layout, "poster");

  ctx.fillStyle = ink.stamp;
  ctx.fillRect(0, layout.bandTop * S, PW * S, (PH - layout.bandTop) * S);

  // The ownership is a straight credit line on the band, left-aligned with
  // the quote. Ink-pale text keeps 4.5:1 on every coral.
  const bandHeight = PH - layout.bandTop;
  const rowsTop = layout.bandTop + (bandHeight - ownershipBlockHeight(layout, false)) / 2;
  drawOwnershipRows(ctx, ink, text, layout, 28, rowsTop, "left", false,
    { label: ink.bg, name: ink.bg, date: ink.bg });
}

function ticketStock(ctx: Ctx, stub = false): void {
  ctx.beginPath();
  if (stub) { ctx.moveTo(13 * S, 333 * S); ctx.lineTo(347 * S, 333 * S); ctx.arc(360 * S, 333 * S, 13 * S, Math.PI, Math.PI / 2, true); }
  else {
    ctx.moveTo(12 * S, 0); ctx.lineTo(348 * S, 0); ctx.arc(360 * S, 0, 12 * S, Math.PI, Math.PI / 2, true);
    ctx.lineTo(360 * S, 320 * S); ctx.arc(360 * S, 333 * S, 13 * S, -Math.PI / 2, Math.PI / 2, true);
  }
  ctx.lineTo(360 * S, 438 * S); ctx.arc(360 * S, 450 * S, 12 * S, -Math.PI / 2, -Math.PI, true);
  ctx.lineTo(12 * S, 450 * S); ctx.arc(0, 450 * S, 12 * S, 0, -Math.PI / 2, true);
  ctx.lineTo(0, 346 * S);
  if (stub) ctx.arc(0, 333 * S, 13 * S, Math.PI / 2, 0, true);
  else {
    ctx.arc(0, 333 * S, 13 * S, Math.PI / 2, -Math.PI / 2, true);
    ctx.lineTo(0, 12 * S); ctx.arc(0, 0, 12 * S, Math.PI / 2, 0, true);
  }
  ctx.closePath();
}

function drawTicket(ctx: Ctx, ink: Ink, text: EditionText, layout: EditionLayout, copy: string): void {
  ticketStock(ctx); ctx.fillStyle = ink.bg; ctx.fill(); ctx.strokeStyle = ink.rule; ctx.lineWidth = 0.8 * S; ctx.stroke();
  ticketStock(ctx, true); ctx.fillStyle = ink.text; ctx.fill();
  ctx.strokeStyle = ink.bg; ctx.lineWidth = 1.5 * S; ctx.setLineDash([3 * S, 4 * S]);
  tracePath(ctx, "M19 333H341", S); ctx.stroke(); ctx.setLineDash([]);
  ctx.strokeStyle = ink.rule; ctx.lineWidth = 0.7 * S;
  tracePath(ctx, "M18 7H342M353 18V312M7 18V312M18 443H342", S); ctx.stroke();

  const headingTop = layout.dense ? 12 : 22;
  const headingInset = layout.dense ? 16 : 30;
  drawLabel(ctx, SITE_NAME, headingInset, headingTop, { color: ink.text, size: 18, weight: EDITION_WEIGHTS.wordmark, leading: 1.2 });
  drawLabel(ctx, text.accession, PW - headingInset, headingTop + 4, { color: ink.text, size: 10, align: "right" });
  ctx.lineWidth = S;
  tracePath(ctx, `M${headingInset} ${headingTop + (layout.dense ? 26 : 33)}H${PW - headingInset}`, S); ctx.stroke();
  drawLabel(ctx, copy, 30, layout.dense ? 315 : 67, { color: ink.stamp, script: text.language, size: layout.dense ? 9 : 12, weight: EDITION_WEIGHTS.book, leading: 1.4 });
  drawFit(ctx, layout.quote, layout.quoteInset, layout.quoteY, { script: text.quoteScript, weight: EDITION_WEIGHTS.ticketQuote, color: ink.text });
  const datelineTop = layout.dense ? 303 : 299;
  drawLabel(ctx, `${EDITION_SHARED_COPY.dated[text.language]} ${text.date}`, 30, datelineTop,
    { color: ink.soft, script: text.dateScript, size: 10, leading: 1.4 });
  drawLabel(ctx, EDITION_SHARED_COPY.languageName[text.language], PW - 30, datelineTop,
    { color: ink.soft, script: text.language, align: "right", size: 10 });
  drawCredit(ctx, ink, text, layout, "ticket");

  ctx.save(); ctx.globalAlpha = 0.4; ctx.strokeStyle = ink.bg; ctx.lineWidth = S; ctx.setLineDash([2 * S, 2 * S]);
  tracePath(ctx, `M231 ${layout.credit.top}V${layout.credit.top + layout.credit.labelHeight + layout.credit.gap + layout.book.height + layout.author.height}`, S);
  ctx.stroke(); ctx.restore();

  ctx.save(); ctx.translate(297 * S, 391.5 * S); ctx.rotate(-5 * Math.PI / 180);
  // One coral ring; the inner circle and tick marks are gone.
  const k = 108 / 132;
  ctx.beginPath(); ctx.arc(0, 0, 50 * k * S, 0, Math.PI * 2);
  ctx.fillStyle = ink.bg; ctx.fill();
  ctx.strokeStyle = ink.stamp; ctx.lineWidth = 1.4 * k * S; ctx.stroke();
  const rowsTop = -(12.35 + 2 + layout.name.height) / 2;
  drawLabel(ctx, EDITION_SHARED_COPY.carriedBy[text.language], 0, rowsTop, { color: ink.stamp, script: text.language, align: "center", size: 9.5 });
  drawFit(ctx, layout.name, 0, rowsTop + 14.35,
    { script: text.nameScript, weight: EDITION_WEIGHTS.name, color: ink.stamp, align: "center" });
  ctx.restore();
}

export async function exportLineCard(payload: LinePayload, id: string, book?: Book): Promise<Blob> {
  const ink = INKS[payload.s];
  const content = cardPresentation(payload, book);
  if (!content) throw new Error("Book not found");
  await loadCanvasFonts();
  const canvas = document.createElement("canvas");
  canvas.width = PW * S; canvas.height = PH * S;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.letterSpacing = "0px";
  const text = editionText(content, id);
  const layout = layoutEditionArtwork(text, content.edition);
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
  a.href = url; a.download = `carried-${accessionNo(id).toLowerCase()}.png`;
  document.body.appendChild(a);
  a.click(); a.remove(); URL.revokeObjectURL(url);
}

export async function lineCardBlob(payload: LinePayload, id: string, book?: Book): Promise<Blob | null> {
  try { return await exportLineCard(payload, id, book); } catch { return null; }
}
