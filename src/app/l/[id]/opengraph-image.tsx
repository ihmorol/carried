import { ImageResponse } from "next/og";
import { accessionNo } from "@/lib/line";
import { CARD_WEIGHTS, cardFontFamily, cardPresentation } from "@/lib/card-presentation";
import { CARD_SURFACES, layoutCardText, type CardRegion, type TextFit } from "@/lib/text-layout";
import { INKS } from "@/lib/inks";
import { loadOgFonts } from "@/lib/og-fonts";
import { SITE_NAME } from "@/lib/site";
import { resolveBookForLine, resolveLine } from "@/lib/store";
import type { CSSProperties } from "react";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "A carried line";

/** A landscape cut of the same compact group as the portrait export. Regions
 * follow the fitted text; no fixed-height quote pushes provenance away. */
export default async function OgImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const fonts = loadOgFonts();
  const payload = await resolveLine(id);
  const book = payload ? await resolveBookForLine(payload) : undefined;
  const content = payload && book ? cardPresentation(payload, book) : undefined;
  if (!payload || !content) {
    const ink = INKS.paper;
    return new ImageResponse(
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: ink.bg }}>
        <span style={{ fontFamily: cardFontFamily("latin", "serif", "og"), fontWeight: 600, fontSize: 48, color: ink.text }}>{SITE_NAME}</span>
      </div>, { ...size, fonts });
  }
  const ink = INKS[payload.s];
  const { scale } = CARD_SURFACES.og;
  const layout = layoutCardText(content, "og");
  const { regions, metadata } = layout;
  const sans = (script: typeof content.quoteScript, weight: CSSProperties["fontWeight"]): CSSProperties => ({ fontFamily: cardFontFamily(script, "serif", "og"), fontWeight: weight });
  const block = (fit: TextFit, region: CardRegion, style: CSSProperties) => (
    <div style={{ position: "absolute", left: region.x, top: region.y, width: region.width, display: "flex", flexDirection: "column", ...style,
      fontSize: fit.fontSize, lineHeight: `${fit.lineHeight}px` }}>
      {fit.lines.map((line, index) => <span key={index} style={{ height: fit.lineHeight, whiteSpace: "pre" }}>{line.replace(/[\r\n]/g, "")}</span>)}
    </div>
  );
  const label = (text: string, region: CardRegion, color: string) => (
    <span style={{ position: "absolute", left: region.x, top: region.y, ...sans("latin", CARD_WEIGHTS.metadata),
      fontSize: metadata.fontSize, lineHeight: `${metadata.lineHeight}px`, color }}>{text}</span>
  );
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", backgroundColor: ink.bg, color: ink.text }}>
      <div style={{ position: "absolute", inset: 12 * scale, border: `${scale}px solid ${ink.rule}`, borderRadius: 12 * scale }} />
      <div style={{ position: "absolute", inset: 16 * scale, border: `${scale}px solid ${ink.rule}`, borderRadius: 8 * scale }} />
      <div style={{ position: "absolute", left: regions.header.x, top: regions.header.y, width: regions.header.width, display: "flex", justifyContent: "space-between",
        ...sans("latin", CARD_WEIGHTS.metadata), fontSize: metadata.fontSize, lineHeight: `${metadata.lineHeight}px` }}>
        <span>{SITE_NAME}</span>
        <span style={{ color: ink.soft }}>No. {accessionNo(id)}</span>
      </div>
      {block(layout.quote, regions.quote, sans(content.quoteScript, CARD_WEIGHTS.quote))}
      {label("Carried out of", regions.provenance, ink.soft)}
      {block(layout.title, regions.title, sans(content.titleScript, CARD_WEIGHTS.title))}
      {block(layout.byline, regions.byline, { ...sans(content.authorScript, CARD_WEIGHTS.byline), color: ink.soft })}
      <div style={{ position: "absolute", left: regions.stamp.x, top: regions.stamp.y, width: regions.stamp.width, height: regions.stamp.height,
        border: `${scale}px solid ${ink.stamp}`, borderRadius: 6 * scale }} />
      {label("Carried by", regions.stampLabel, ink.stamp)}
      {block(layout.name, regions.name, { ...sans(content.nameScript, CARD_WEIGHTS.name), color: ink.stamp })}
      {block(layout.date, regions.date, { ...sans(content.dateScript, CARD_WEIGHTS.date), color: ink.stamp, textAlign: "right" })}
    </div>, { ...size, fonts });
}
