import { resolveStyle } from "./card-style";
import { cardArtSvg, svgDataUri } from "./card-art";
import type { CardFont } from "./card-fonts";
import { getBook, originalName } from "./books";
import { accessionNo, formatStampDate, formatStampDateBn, isBengali, type LinePayload } from "./line";
import { SITE_NAME } from "./site";

/**
 * Renders the catalog card to a 1080×1350 PNG (4:5, feeds crop it well).
 * Mirrors LineCard exactly: same inks, same type, same stamp. The card
 * fills the frame edge to edge, the PNG is the artifact itself, so the
 * drop shadow around DOM cards is LineCard page dressing and has no
 * equivalent here.
 * Fonts are loaded from /fonts so the export never depends on OS fonts.
 */

const W = 1080;
const H = 1350;
const M = 92; // outer margin

// document.fonts.check() answers true for a family that was never
// registered at all, so it can't tell us whether a face is loaded;
// remember what we registered instead.
const registered = new Map<string, Promise<void>>();

function loadFont(family: string, file: string, weight: string, style: string): Promise<void> {
  if (typeof document === "undefined") return Promise.resolve();
  const key = `${family}|${file}|${weight}|${style}`;
  let p = registered.get(key);
  if (!p) {
    const face = new FontFace(family, `url(/fonts/${file})`, { weight, style });
    p = face.load().then((f) => {
      document.fonts.add(f);
    });
    p.catch(() => registered.delete(key));
    registered.set(key, p);
  }
  return p;
}

/** Register the card's chosen face(s) for the export. Fraunces is already loaded. */
async function loadCardFont(font: CardFont): Promise<void> {
  if (font.id === "fraunces") return;
  const specs = font.quote.file === font.name.file ? [font.quote] : [font.quote, font.name];
  await Promise.all(specs.map((f) => loadFont(exportFamily(font), f.file, String(f.weight), f.style)));
}

function exportFamily(font: CardFont): string {
  return font.id === "fraunces" ? "Fraunces Export" : `${font.family} Export`;
}

function cssFont(font: CardFont, face: "quote" | "name", px: number): string {
  const f = font[face];
  return `${f.style === "italic" ? "italic " : ""}${f.weight} ${px}px "${exportFamily(font)}"`;
}

async function loadSvg(svg: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.src = svgDataUri(svg);
  await img.decode();
  return img;
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    const test = current ? `${current} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = w;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function exportLineCard(payload: LinePayload, id: string): Promise<Blob> {
  const { ink, pattern, font } = resolveStyle(payload);
  const book = getBook(payload.b);
  if (!book) throw new Error("Book not found");

  await Promise.all([
    loadFont("Fraunces Export", "Fraunces-500.ttf", "500", "normal"),
    loadFont("Fraunces Export", "Fraunces-600.ttf", "600", "normal"),
    loadFont("Fraunces Export", "Fraunces-Italic-500.ttf", "500", "italic"),
    loadFont("Plex Export", "IBMPlexMono-400.ttf", "400", "normal"),
    loadFont("Plex Export", "IBMPlexMono-500.ttf", "500", "normal"),
    loadFont("Plex Export", "IBMPlexMono-600.ttf", "600", "normal"),
    loadFont("Noto Serif Bengali Export", "NotoSerifBengali-500.ttf", "500", "normal"),
    loadFont("Noto Serif Bengali Export", "NotoSerifBengali-600.ttf", "600", "normal"),
    loadFont("Noto Serif Bengali Export", "NotoSerifBengali-700.ttf", "700", "normal"),
    loadFont("Noto Sans Bengali Export", "NotoSansBengali-400.ttf", "400", "normal"),
    loadFont("Noto Sans Bengali Export", "NotoSansBengali-500.ttf", "500", "normal"),
    loadFont("Noto Sans Bengali Export", "NotoSansBengali-600.ttf", "600", "normal"),
    loadCardFont(font),
  ]);
  await document.fonts.ready;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");

  // paper
  ctx.fillStyle = ink.bg;
  ctx.fillRect(0, 0, W, H);

  // the printed pattern, the same SVG the DOM card and OG image paint
  const art = cardArtSvg(pattern.id, ink, W, H);
  if (art) ctx.drawImage(await loadSvg(art), 0, 0, W, H);

  // double rule border, unless the pattern draws its own frame
  if (!pattern.frame) {
    ctx.strokeStyle = ink.rule;
    ctx.lineWidth = 2;
    ctx.strokeRect(M - 34, M - 34, W - 2 * (M - 34), H - 2 * (M - 34));
    ctx.lineWidth = 1.5;
    ctx.strokeRect(M - 22, M - 22, W - 2 * (M - 22), H - 2 * (M - 22));
  }

  // ledger head
  ctx.fillStyle = ink.text;
  ctx.font = '600 22px "Plex Export"';
  (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "9px";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(SITE_NAME.toUpperCase(), M, M + 8);
  const no = `No. ${accessionNo(id)}`;
  ctx.textAlign = "right";
  ctx.fillText(no, W - M, M + 8);
  ctx.textAlign = "left";
  (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "0px";

  // the line, size steps down as it grows; Bangla script gets its own serif
  const len = payload.q.length;
  const bn = isBengali(payload.q);
  const quoteSize = Math.round(
    (len > 170 ? 44 : len > 110 ? 50 : len > 60 ? 56 : 62) * (bn ? 0.88 : font.scale),
  );
  const quoteFont = bn
    ? `500 ${quoteSize}px "Noto Serif Bengali Export"`
    : cssFont(font, "quote", quoteSize);
  ctx.font = quoteFont;
  const quoteLines = wrap(ctx, payload.q, W - 2 * M);
  // the DOM leads at font.leading; the export runs a touch tighter, as before
  const quoteLH = quoteSize * (bn ? 1.75 : font.leading * (1.42 / 1.5));
  let y = M + 176;

  // oversized open-quote mark (latin cards only, Bangla has no quote glyph style here)
  ctx.fillStyle = ink.rule;
  ctx.font = 'italic 500 150px "Fraunces Export"';
  if (!bn) ctx.fillText("\u201C", M - 10, y - 44);

  ctx.fillStyle = ink.text;
  ctx.font = quoteFont;
  for (const line of quoteLines) {
    ctx.fillText(line, M, y);
    y += quoteLH;
  }

  // provenance
  // anchored to the foot like the DOM card, the longest line still clears it
  const provY = Math.max(H - M - 400, y + 40);
  ctx.strokeStyle = ink.rule;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(M, provY);
  ctx.lineTo(W - M, provY);
  ctx.stroke();

  ctx.fillStyle = ink.soft;
  ctx.font = '600 20px "Plex Export"';
  (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "8px";
  ctx.fillText("CARRIED OUT OF", M, provY + 56);
  (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "0px";

  ctx.fillStyle = ink.text;
  const provTitle = originalName(book);
  const provTitleBn = isBengali(provTitle);
  ctx.font = provTitleBn
    ? '600 34px "Noto Serif Bengali Export"'
    : cssFont(font, "name", Math.round(40 * font.scale));
  ctx.fillText(provTitle, M, provY + 112);

  ctx.fillStyle = ink.soft;
  ctx.font = '400 24px "Plex Export"';
  ctx.fillText(
    `${book.author} · ${book.year < 0 ? `${Math.abs(book.year)} BC` : book.year}`,
    M,
    provY + 152,
  );

  // the stamp
  const bnName = isBengali(payload.n);
  const stamp = {
    w: 380,
    h: 170,
    x: (W - 380) / 2,
    y: H - M - 190,
  };
  ctx.save();
  ctx.translate(stamp.x + stamp.w / 2, stamp.y + stamp.h / 2);
  ctx.rotate(-6.5 * (Math.PI / 180));
  ctx.globalAlpha = 0.88;
  ctx.strokeStyle = ink.stamp;
  ctx.fillStyle = ink.stamp;
  ctx.lineWidth = 5;
  ctx.strokeRect(-stamp.w / 2, -stamp.h / 2, stamp.w, stamp.h);
  ctx.textAlign = "center";
  ctx.font = '600 18px "Plex Export"';
  (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "6px";
  ctx.fillText("CARRIED BY", 0, -34);
  (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "0px";
  ctx.font = bnName
    ? '600 46px "Noto Serif Bengali Export"'
    : cssFont(font, "name", Math.round(52 * font.scale));
  ctx.fillText(payload.n, 0, 22);
  ctx.font = '500 16px "Plex Export"';
  (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "5px";
  ctx.fillText(bnName ? formatStampDateBn(payload.d) : formatStampDate(payload.d), 0, 56);
  (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "0px";
  ctx.restore();
  ctx.textAlign = "left";

  // footer
  ctx.fillStyle = ink.soft;
  ctx.font = '400 19px "Plex Export"';
  (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "4px";
  ctx.fillText(
    `${SITE_NAME.toUpperCase()}, THE LINE A BOOK LEFT IN YOU`,
    M,
    H - M + 26,
  );
  (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "0px";

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Export failed"));
    }, "image/png");
  });
}

export async function downloadLineCard(payload: LinePayload, id: string): Promise<void> {
  const blob = await exportLineCard(payload, id);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `carried-${accessionNo(id).toLowerCase()}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function lineCardBlob(payload: LinePayload, id: string): Promise<Blob | null> {
  try {
    return await exportLineCard(payload, id);
  } catch {
    return null;
  }
}
