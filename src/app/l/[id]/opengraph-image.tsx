import { ImageResponse } from "next/og";
import { accessionNo } from "@/lib/line";
import { cardFontFamily, cardPresentation } from "@/lib/card-presentation";
import { CARD_REGIONS, estimateTextWidth, fitText, layoutCardText, type TextFit } from "@/lib/text-layout";
import { INKS } from "@/lib/inks";
import { loadOgFonts } from "@/lib/og-fonts";
import { SITE_NAME } from "@/lib/site";
import { resolveBookForLine, resolveLine } from "@/lib/store";
import type { CSSProperties } from "react";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "A carried line";

/** A landscape cut, with reserved quote, provenance, and ownership regions.
 * Wrapping is explicit because satori has no browser text measurement. */
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
        <span style={{ fontFamily: "Fraunces", fontWeight: 600, fontSize: 48, letterSpacing: 12, color: ink.text }}>{SITE_NAME.toUpperCase()}</span>
      </div>, { ...size, fonts });
  }
  const ink = INKS[payload.s];
  const regions = CARD_REGIONS.og;
  const layout = layoutCardText(content, "og");
  const serif = (script: typeof content.quoteScript): CSSProperties => ({ fontFamily: cardFontFamily(script, "serif", "og"), fontWeight: 600 });
  const date = fitText(content.date, { width: regions.stamp.width - 32, height: 24, maxFontSize: 14, minFontSize: 12,
    leading: 1.65, measure: (text, size) => estimateTextWidth(text, size, "mono") });
  const block = (fit: TextFit, region: { x: number; y: number; width: number }, style: CSSProperties) => (
    <div style={{ position: "absolute", left: region.x, top: region.y, width: region.width, display: "flex", flexDirection: "column", ...style,
      fontSize: fit.fontSize, lineHeight: `${fit.lineHeight}px` }}>
      {fit.lines.map((line, index) => <span key={index} style={{ height: fit.lineHeight, whiteSpace: "pre" }}>{line.replace(/[\r\n]/g, "")}</span>)}
    </div>
  );
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", backgroundColor: ink.bg, color: ink.text }}>
      <div style={{ position: "absolute", inset: 26, border: `1.5px solid ${ink.rule}` }} />
      <div style={{ position: "absolute", inset: 34, border: `1px solid ${ink.rule}` }} />
      <div style={{ position: "absolute", left: 82, right: 82, top: 72, display: "flex", justifyContent: "space-between", fontFamily: "Plex", fontWeight: 600 }}>
        <span style={{ fontSize: 22, letterSpacing: 7 }}>{SITE_NAME.toUpperCase()}</span>
        <span style={{ fontSize: 20, letterSpacing: 4, color: ink.soft }}>No. {accessionNo(id)}</span>
      </div>
      {content.quoteScript === "latin" && <span style={{ position: "absolute", left: 72, top: 106, fontFamily: "Fraunces", fontStyle: "italic", fontSize: 98, color: ink.rule }}>“</span>}
      {block(layout.quote, regions.quote, { ...serif(content.quoteScript), fontWeight: 500, fontStyle: content.quoteScript === "latin" ? "italic" : "normal" })}
      <div style={{ position: "absolute", left: 82, top: 395, width: 636, height: 1, backgroundColor: ink.rule }} />
      <span style={{ position: "absolute", left: 82, top: 405, fontFamily: "Plex", fontWeight: 600, fontSize: 14, letterSpacing: 5, color: ink.soft }}>CARRIED OUT OF</span>
      {block(layout.title, regions.title, serif(content.titleScript))}
      {block(layout.byline, regions.byline, { fontFamily: cardFontFamily(content.authorScript, "mono", "og"), fontWeight: 400, color: ink.soft })}
      <div style={{ position: "absolute", left: regions.stamp.x, top: regions.stamp.y, width: regions.stamp.width, height: regions.stamp.height,
        display: "flex", flexDirection: "column", alignItems: "center", border: `3px solid ${ink.stamp}`, borderRadius: 6,
        color: ink.stamp, transform: "rotate(-6.5deg)" }}>
        <span style={{ position: "absolute", top: 12, fontFamily: "Plex", fontWeight: 600, fontSize: 14, letterSpacing: 4 }}>CARRIED BY</span>
        <div style={{ position: "absolute", top: 39 + (regions.name.height - layout.name.height) / 2, width: regions.name.width,
          display: "flex", flexDirection: "column", alignItems: "center", ...serif(content.nameScript), fontSize: layout.name.fontSize,
          lineHeight: `${layout.name.lineHeight}px` }}>
          {layout.name.lines.map((line, index) => <span key={index} style={{ whiteSpace: "pre", height: layout.name.lineHeight }}>{line}</span>)}
        </div>
        <span style={{ position: "absolute", top: 110, fontFamily: cardFontFamily(content.dateScript, "mono", "og"), fontWeight: 500,
          fontSize: date.fontSize, lineHeight: 1.65 }}>{content.date}</span>
      </div>
    </div>, { ...size, fonts });
}
