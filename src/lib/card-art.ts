import type { Ink } from "./inks";

/**
 * Card patterns: the printed artwork behind the line. Each pattern is a
 * pure function (ink, width, height) → SVG markup, and that one string is
 * what all three surfaces paint, the DOM card (as a background image),
 * the canvas export (drawImage) and satori (an <img>), so the artwork
 * can't drift between them.
 *
 * Flat strokes and fills only, no gradients. Sizes are expressed in a
 * unit `u` that scales with the card, so a 320px DOM card and the
 * 1080px PNG carry the same proportions.
 *
 * `frame: true` means the pattern draws its own border and the default
 * double rule is left off.
 */
export type PatternId =
  | "classic"
  | "lined"
  | "grid"
  | "dots"
  | "edge"
  | "sunburst"
  | "halftone"
  | "stripes"
  | "deco"
  | "ornate"
  | "botanical"
  | "letterpress";

export type Pattern = {
  id: PatternId;
  label: string;
  labelBn: string;
  frame: boolean;
};

export const PATTERNS: Record<PatternId, Pattern> = {
  classic: { id: "classic", label: "Double rule", labelBn: "ডাবল রুল", frame: false },
  lined: { id: "lined", label: "Index card", labelBn: "ইনডেক্স কার্ড", frame: true },
  grid: { id: "grid", label: "Graph paper", labelBn: "গ্রাফ পেপার", frame: true },
  dots: { id: "dots", label: "Dot grid", labelBn: "ডট গ্রিড", frame: false },
  edge: { id: "edge", label: "Painted edge", labelBn: "রঙিন কিনারা", frame: true },
  sunburst: { id: "sunburst", label: "Sunburst", labelBn: "সূর্যরশ্মি", frame: true },
  halftone: { id: "halftone", label: "Halftone", labelBn: "হাফটোন", frame: false },
  stripes: { id: "stripes", label: "Ticket stripes", labelBn: "টিকিট স্ট্রাইপ", frame: true },
  deco: { id: "deco", label: "Art deco", labelBn: "আর্ট ডেকো", frame: true },
  ornate: { id: "ornate", label: "Flourish", labelBn: "নকশা", frame: true },
  botanical: { id: "botanical", label: "Botanical", labelBn: "লতাপাতা", frame: false },
  letterpress: { id: "letterpress", label: "Letterpress", labelBn: "লেটারপ্রেস", frame: true },
};

export const PATTERN_IDS = Object.keys(PATTERNS) as PatternId[];
export const DEFAULT_PATTERN: PatternId = "classic";

export function isPatternId(v: string): v is PatternId {
  return Object.prototype.hasOwnProperty.call(PATTERNS, v);
}

/** The scale unit: 1 on a 320px-wide portrait card. */
export function artUnit(w: number, h: number): number {
  return Math.min(w, h * 0.8) / 320;
}

const n = (v: number) => (Math.round(v * 100) / 100).toString();

function rect(x: number, y: number, w: number, h: number, stroke: string, sw: number, extra = ""): string {
  return `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" fill="none" stroke="${stroke}" stroke-width="${n(sw)}"${extra}/>`;
}

function inset(w: number, h: number, d: number, stroke: string, sw: number, extra = ""): string {
  return rect(d, d, w - 2 * d, h - 2 * d, stroke, sw, extra);
}

/** Mirror a corner drawn at the top-left origin into all four corners. */
function fourCorners(w: number, h: number, body: string): string {
  return [
    `<g>${body}</g>`,
    `<g transform="translate(${n(w)} 0) scale(-1 1)">${body}</g>`,
    `<g transform="translate(0 ${n(h)}) scale(1 -1)">${body}</g>`,
    `<g transform="translate(${n(w)} ${n(h)}) scale(-1 -1)">${body}</g>`,
  ].join("");
}

function body(id: PatternId, ink: Ink, w: number, h: number): string {
  const u = artUnit(w, h);
  switch (id) {
    case "classic":
      return "";

    case "lined": {
      // the library index card: a stamp-colored head rule, then faint ruled lines
      const out: string[] = [];
      const headY = 44 * u;
      out.push(`<line x1="0" y1="${n(headY)}" x2="${n(w)}" y2="${n(headY)}" stroke="${ink.stamp}" stroke-width="${n(1.2 * u)}" opacity="0.55"/>`);
      out.push(`<line x1="0" y1="${n(headY + 3 * u)}" x2="${n(w)}" y2="${n(headY + 3 * u)}" stroke="${ink.stamp}" stroke-width="${n(0.6 * u)}" opacity="0.45"/>`);
      for (let y = headY + 24 * u; y < h - 8 * u; y += 22 * u) {
        out.push(`<line x1="0" y1="${n(y)}" x2="${n(w)}" y2="${n(y)}" stroke="${ink.rule}" stroke-width="${n(0.7 * u)}" opacity="0.9"/>`);
      }
      out.push(`<line x1="${n(14 * u)}" y1="0" x2="${n(14 * u)}" y2="${n(h)}" stroke="${ink.stamp}" stroke-width="${n(0.7 * u)}" opacity="0.35"/>`);
      return out.join("");
    }

    case "grid": {
      const out: string[] = [];
      const step = 16 * u;
      const sw = n(0.5 * u);
      for (let x = step; x < w; x += step) out.push(`<line x1="${n(x)}" y1="0" x2="${n(x)}" y2="${n(h)}" stroke="${ink.rule}" stroke-width="${sw}" opacity="0.75"/>`);
      for (let y = step; y < h; y += step) out.push(`<line x1="0" y1="${n(y)}" x2="${n(w)}" y2="${n(y)}" stroke="${ink.rule}" stroke-width="${sw}" opacity="0.75"/>`);
      out.push(inset(w, h, 6 * u, ink.soft, 0.9 * u, ' opacity="0.7"'));
      return out.join("");
    }

    case "dots": {
      const out: string[] = [];
      const step = 14 * u;
      const r = n(0.95 * u);
      for (let y = step; y < h - step / 2; y += step) {
        for (let x = step; x < w - step / 2; x += step) {
          out.push(`<circle cx="${n(x)}" cy="${n(y)}" r="${r}"/>`);
        }
      }
      return `<g fill="${ink.soft}" opacity="0.32">${out.join("")}</g>`;
    }

    case "edge": {
      // a painted edge, like a duplexed card with a colored core
      const band = 5 * u;
      return [
        `<rect x="${n(band / 2)}" y="${n(band / 2)}" width="${n(w - band)}" height="${n(h - band)}" fill="none" stroke="${ink.stamp}" stroke-width="${n(band)}"/>`,
        inset(w, h, 11 * u, ink.rule, 0.9 * u),
      ].join("");
    }

    case "sunburst": {
      // flat alternating rays from below the card, retro paperback style
      const cx = w / 2;
      const cy = h * 1.04;
      const R = Math.hypot(w, h) * 1.2;
      const rays = 28;
      const out: string[] = [];
      for (let i = 0; i < rays; i += 2) {
        const a0 = Math.PI + (i / rays) * Math.PI;
        const a1 = Math.PI + ((i + 1) / rays) * Math.PI;
        out.push(
          `<path d="M${n(cx)} ${n(cy)} L${n(cx + R * Math.cos(a0))} ${n(cy + R * Math.sin(a0))} L${n(cx + R * Math.cos(a1))} ${n(cy + R * Math.sin(a1))} Z"/>`,
        );
      }
      return [
        `<g fill="${ink.rule}" opacity="0.38">${out.join("")}</g>`,
        inset(w, h, 7 * u, ink.text, 1.1 * u, ' opacity="0.55"'),
      ].join("");
    }

    case "halftone": {
      // a corner of printer's dots that shrink as they travel inward
      const out: string[] = [];
      const step = 9 * u;
      const reach = Math.min(w, h) * 0.62;
      const ox = w;
      const oy = h;
      for (let y = h - step / 2; y > h - reach; y -= step) {
        for (let x = w - step / 2; x > w - reach; x -= step) {
          const d = Math.hypot(ox - x, oy - y) / reach;
          if (d >= 1) continue;
          const r = (1 - d) * step * 0.48;
          if (r < 0.35 * u) continue;
          out.push(`<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}"/>`);
        }
      }
      const top: string[] = [];
      for (let y = step / 2; y < reach * 0.55; y += step) {
        for (let x = step / 2; x < reach * 0.55; x += step) {
          const d = Math.hypot(x, y) / (reach * 0.55);
          if (d >= 1) continue;
          const r = (1 - d) * step * 0.4;
          if (r < 0.35 * u) continue;
          top.push(`<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}"/>`);
        }
      }
      return `<g fill="${ink.rule}" opacity="0.8">${out.join("")}${top.join("")}</g>`;
    }

    case "stripes": {
      // three-band ticket stripes at the head and foot
      const s = 2.6 * u;
      const gap = 1.6 * u;
      const colors = [ink.stamp, ink.soft, ink.rule];
      const out: string[] = [];
      colors.forEach((c, i) => {
        const y = 5 * u + i * (s + gap);
        out.push(`<rect x="0" y="${n(y)}" width="${n(w)}" height="${n(s)}" fill="${c}"/>`);
        out.push(`<rect x="0" y="${n(h - y - s)}" width="${n(w)}" height="${n(s)}" fill="${c}"/>`);
      });
      return out.join("");
    }

    case "deco": {
      const o = 7 * u;
      const i = 11 * u;
      const step = 7 * u;
      const corner = [
        // stepped corner blocks between the two frames
        `<path d="M${n(o)} ${n(o + 3 * step)} H${n(i + step)} V${n(i + step)} H${n(o + 3 * step)} V${n(o)}" fill="none" stroke="${ink.stamp}" stroke-width="${n(1 * u)}"/>`,
        `<path d="M${n(o)} ${n(o + 2 * step)} H${n(i)} V${n(i)} H${n(o + 2 * step)} V${n(o)}" fill="none" stroke="${ink.stamp}" stroke-width="${n(0.7 * u)}" opacity="0.7"/>`,
        `<rect x="${n(i + step + 3 * u)}" y="${n(i + step + 3 * u)}" width="${n(2.6 * u)}" height="${n(2.6 * u)}" fill="${ink.stamp}" transform="rotate(45 ${n(i + step + 4.3 * u)} ${n(i + step + 4.3 * u)})"/>`,
      ].join("");
      const dm = 3.4 * u;
      return [
        inset(w, h, o, ink.rule, 1.2 * u),
        inset(w, h, i, ink.rule, 0.7 * u),
        fourCorners(w, h, corner),
        // a diamond on the foot rule, under the stamp
        `<path d="M${n(w / 2)} ${n(h - o - dm)} L${n(w / 2 + dm)} ${n(h - o)} L${n(w / 2)} ${n(h - o + dm)} L${n(w / 2 - dm)} ${n(h - o)} Z" fill="${ink.bg}" stroke="${ink.stamp}" stroke-width="${n(0.9 * u)}"/>`,
      ].join("");
    }

    case "ornate": {
      const o = 7 * u;
      const r = 9 * u;
      const curl = [
        `<path d="M${n(o)} ${n(o + 26 * u)} C${n(o)} ${n(o + 8 * u)} ${n(o + 8 * u)} ${n(o)} ${n(o + 26 * u)} ${n(o)}" fill="none" stroke="${ink.soft}" stroke-width="${n(0.9 * u)}"/>`,
        `<circle cx="${n(o + r)}" cy="${n(o + r)}" r="${n(r * 0.45)}" fill="none" stroke="${ink.soft}" stroke-width="${n(0.8 * u)}"/>`,
        `<circle cx="${n(o + r)}" cy="${n(o + r)}" r="${n(1.2 * u)}" fill="${ink.stamp}"/>`,
        `<path d="M${n(o + 30 * u)} ${n(o)} q${n(6 * u)} ${n(4 * u)} ${n(12 * u)} 0" fill="none" stroke="${ink.soft}" stroke-width="${n(0.8 * u)}"/>`,
        `<path d="M${n(o)} ${n(o + 30 * u)} q${n(4 * u)} ${n(6 * u)} 0 ${n(12 * u)}" fill="none" stroke="${ink.soft}" stroke-width="${n(0.8 * u)}"/>`,
      ].join("");
      return [
        // frame with notched corners so the flourish sits in the gap
        `<path d="M${n(o + 46 * u)} ${n(o)} H${n(w - o - 46 * u)} M${n(w - o)} ${n(o + 46 * u)} V${n(h - o - 46 * u)} M${n(w - o - 46 * u)} ${n(h - o)} H${n(o + 46 * u)} M${n(o)} ${n(h - o - 46 * u)} V${n(o + 46 * u)}" stroke="${ink.soft}" stroke-width="${n(0.9 * u)}" fill="none"/>`,
        inset(w, h, o + 4 * u, ink.rule, 0.6 * u),
        fourCorners(w, h, curl),
      ].join("");
    }

    case "botanical": {
      // a sprig of leaves along a curved stem, in two corners
      const leaves: string[] = [];
      const stem = `M${n(4 * u)} ${n(70 * u)} C${n(20 * u)} ${n(50 * u)} ${n(40 * u)} ${n(24 * u)} ${n(78 * u)} ${n(6 * u)}`;
      const pts: Array<[number, number, number]> = [
        [12, 58, -30], [22, 46, 150], [30, 36, -45], [40, 27, 135], [50, 20, -60], [60, 14, 120], [70, 9, -70],
      ];
      for (const [x, y, a] of pts) {
        leaves.push(
          `<ellipse cx="${n(x * u)}" cy="${n(y * u)}" rx="${n(7 * u)}" ry="${n(2.8 * u)}" transform="rotate(${a} ${n(x * u)} ${n(y * u)}) translate(${n(5 * u * Math.sign(a))} 0)"/>`,
        );
      }
      const sprig = [
        `<path d="${stem}" fill="none" stroke="${ink.soft}" stroke-width="${n(0.9 * u)}"/>`,
        `<g fill="none" stroke="${ink.soft}" stroke-width="${n(0.8 * u)}">${leaves.join("")}</g>`,
        `<circle cx="${n(78 * u)}" cy="${n(6 * u)}" r="${n(2 * u)}" fill="${ink.stamp}"/>`,
      ].join("");
      const s = 1.15;
      return [
        `<g opacity="0.55" transform="translate(${n(w - 6 * u)} ${n(6 * u)}) scale(${-s} ${s}) translate(0 0)">${sprig}</g>`,
        `<g opacity="0.55" transform="translate(${n(6 * u)} ${n(h - 6 * u)}) scale(${s} ${-s})">${sprig}</g>`,
      ].join("");
    }

    case "letterpress": {
      // a debossed plate: a pressed frame, with its shadow and highlight
      const o = 10 * u;
      return [
        rect(o + 0.8 * u, o + 0.8 * u, w - 2 * o, h - 2 * o, ink.rule, 2.2 * u, ' opacity="0.9"'),
        rect(o, o, w - 2 * o, h - 2 * o, ink.soft, 1.1 * u, ' opacity="0.55"'),
        inset(w, h, o + 5 * u, ink.rule, 0.6 * u),
      ].join("");
    }
  }
}

/** Full SVG document for a pattern at a given size, or null for none. */
export function cardArtSvg(id: PatternId, ink: Ink, w: number, h: number): string | null {
  const inner = body(id, ink, w, h);
  if (!inner) return null;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${n(w)}" height="${n(h)}" viewBox="0 0 ${n(w)} ${n(h)}">${inner}</svg>`;
}

export function svgDataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
