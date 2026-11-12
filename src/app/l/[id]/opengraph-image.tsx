import { ImageResponse } from "next/og";
import { EDITION_COPY, EDITION_SHARED_COPY, EDITION_WEIGHTS, cardFontFamily, cardPresentation, editionText, type CardFontRole } from "@/lib/card-presentation";
import { EDITION_OG, layoutEditionOg, type EditionOgLayout, type TextFit } from "@/lib/text-layout";
import { INKS } from "@/lib/inks";
import { loadOgFonts } from "@/lib/og-fonts";
import { SITE_NAME } from "@/lib/site";
import { resolveBookForLine, resolveLine } from "@/lib/store";
import type { CSSProperties } from "react";

export const runtime = "nodejs";
export const size = { width: EDITION_OG.width, height: EDITION_OG.height };
export const contentType = "image/png";
export const alt = "A carried line";

const { width: W, height: H } = EDITION_OG;

/** Landscape cuts of the three editions: each keeps its identity (hairline
 * plate rule + signature ownership, poster band + credit line, ticket stub +
 * circular cancellation) with the full bilingual text fitted at readable
 * floors, never truncated. */
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
        <span style={{ fontFamily: cardFontFamily("latin", "text", "og"), fontWeight: 600, fontSize: 48, color: ink.text }}>{SITE_NAME}</span>
      </div>, { ...size, fonts });
  }
  const ink = INKS[payload.s];
  const text = editionText(content, id);
  const layout = layoutEditionOg(text, content.edition);
  const shared = EDITION_SHARED_COPY;
  const dated = `${shared.dated[text.language]} ${text.date}`;
  const voice = (script: typeof content.quoteScript, role: CardFontRole, weight: CSSProperties["fontWeight"]): CSSProperties =>
    ({ fontFamily: cardFontFamily(script, role, "og"), fontWeight: weight });
  const lines = (fit: TextFit, align: CSSProperties["textAlign"] = "left") => fit.lines.map((line, index) => (
    <span key={index} style={{ width: "100%", height: fit.lineHeight, display: "flex", justifyContent: align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start", whiteSpace: "pre" }}>{line.replace(/[\r\n]/g, "")}</span>
  ));
  const block = (fit: TextFit, region: EditionOgLayout["regions"]["quote"], style: CSSProperties) => (
    <div style={{ position: "absolute", left: region.x, top: region.y, width: region.width, display: "flex", flexDirection: "column", ...style,
      fontSize: fit.fontSize, lineHeight: `${fit.lineHeight}px` }}>
      {lines(fit, style.textAlign)}
    </div>
  );
  const span = (value: string, style: CSSProperties & { left?: number; top?: number; right?: number; fontSize?: number }) => (
    <span style={{ position: "absolute", display: "flex", justifyContent: style.textAlign === "center" ? "center" : style.textAlign === "right" ? "flex-end" : "flex-start", fontFamily: cardFontFamily("latin", "meta", "og"), fontWeight: EDITION_WEIGHTS.label, ...style }}>{value}</span>
  );

  if (content.edition === "bookplate-v1") {
    return new ImageResponse(
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", backgroundColor: ink.bg, color: ink.text }}>
        {/* One hairline plate rule; the ownership is type plus a coral signature rule. */}
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0 }}>
          <rect fill="none" stroke={ink.text} strokeWidth={2} x={48} y={48} width={1104} height={534} />
        </svg>
        <div style={{ position: "absolute", left: 0, right: 0, top: 46, ...voice("latin", "text", EDITION_WEIGHTS.wordmark), fontSize: 28, lineHeight: 1.1, display: "flex", justifyContent: "center" }}>{SITE_NAME}</div>
        {span(EDITION_COPY["bookplate-v1"][text.language], { left: 0, right: 0, top: 90, fontSize: 17, color: ink.soft, textAlign: "center", fontFamily: cardFontFamily(text.language, "meta", "og") })}
        {span(text.accession, { right: 56, top: 60, fontSize: 15, color: ink.soft })}
        {block(layout.quote, layout.regions.quote, { ...voice(text.quoteScript, "text", EDITION_WEIGHTS.quote), textAlign: "center" })}
        {span(shared.afterReading[text.language], { left: 140, top: 384, width: 920, fontSize: 15, color: ink.soft, textAlign: "center", fontFamily: cardFontFamily(text.language, "meta", "og") })}
        {block(layout.book, layout.regions.book, { ...voice(text.bookScript, "text", EDITION_WEIGHTS.book), textAlign: "center" })}
        {block(layout.author, layout.regions.author, { ...voice(text.authorScript, "meta", EDITION_WEIGHTS.author), color: ink.soft, textAlign: "center" })}
        {span(shared.carriedBy[text.language], { left: 414, top: 494, width: 372, fontSize: 14, color: ink.soft, textAlign: "center", fontFamily: cardFontFamily(text.language, "meta", "og") })}
        {block(layout.name, layout.regions.name, { ...voice(text.nameScript, "meta", EDITION_WEIGHTS.name), color: ink.text, textAlign: "center" })}
        <div style={{ position: "absolute", left: 525, top: 557, width: 150, borderTop: `3px solid ${ink.stamp}` }} />
        {span(dated, { left: 414, top: 562, width: 372, fontSize: 13, color: ink.soft, textAlign: "center", fontFamily: cardFontFamily(text.dateScript, "meta", "og") })}
      </div>, { ...size, fonts });
  }

  if (content.edition === "poster-v1") {
    const fieldColor = ink.id === "midnight" ? ink.bg : ink.text;
    const textColor = ink.id === "midnight" ? ink.text : ink.bg;
    return new ImageResponse(
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", backgroundColor: fieldColor, color: textColor }}>
        <div style={{ position: "absolute", left: 88, top: 46, ...voice("latin", "text", EDITION_WEIGHTS.wordmark), fontSize: 36, lineHeight: 1.2 }}>{SITE_NAME}</div>
        {span(text.accession, { right: 88, top: 54, fontSize: 17, color: textColor })}
        {block(layout.quote, layout.regions.quote, voice(text.quoteScript, "text", EDITION_WEIGHTS.posterQuote))}
        {span(shared.afterReading[text.language], { left: 88, top: 418, fontSize: 15, color: textColor, fontFamily: cardFontFamily(text.language, "meta", "og") })}
        {block(layout.book, layout.regions.book, voice(text.bookScript, "text", EDITION_WEIGHTS.book))}
        {block(layout.author, layout.regions.author, { ...voice(text.authorScript, "meta", EDITION_WEIGHTS.author), color: textColor })}
        <div style={{ position: "absolute", left: 0, right: 0, top: 510, bottom: 0, backgroundColor: ink.stamp, display: "flex" }} />
        {/* Straight credit line on the band, left-aligned with the quote;
            ink-pale text keeps 4.5:1 on every coral. */}
        {span(shared.carriedBy[text.language], { left: 88, top: 522, fontSize: 14, color: ink.bg, fontFamily: cardFontFamily(text.language, "meta", "og") })}
        {block(layout.name, layout.regions.name, { ...voice(text.nameScript, "meta", EDITION_WEIGHTS.name), color: ink.bg })}
        {span(dated, { left: 88, top: 594, fontSize: 14, color: ink.bg, fontFamily: cardFontFamily(text.dateScript, "meta", "og") })}
      </div>, { ...size, fonts });
  }

  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", backgroundColor: ink.bg, color: ink.text }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0 }}>
        <path fill={ink.bg} stroke={ink.rule} strokeWidth={2}
          d="M28 0H866A14 14 0 0 0 894 0H1172A28 28 0 0 1 1200 28V602A28 28 0 0 1 1172 630H894A14 14 0 0 0 866 630H28A28 28 0 0 1 0 602V28A28 28 0 0 1 28 0Z" />
        <path fill={ink.text} stroke="none"
          d="M880 0L866 0A14 14 0 0 0 894 0H1172A28 28 0 0 1 1200 28V602A28 28 0 0 1 1172 630H894A14 14 0 0 0 866 630L880 630Z" />
        <path fill="none" stroke={ink.bg} strokeWidth={4} strokeDasharray="10 13" d="M880 16V614" />
        <path fill="none" stroke={ink.rule} strokeWidth={1.6} d="M42 21H1158M21 42V588M42 609H1158M1179 42V588" />
      </svg>
      <div style={{ position: "absolute", left: 64, top: 44, width: 752, display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <span style={{ ...voice("latin", "text", EDITION_WEIGHTS.wordmark), fontSize: 32, lineHeight: 1.2 }}>{SITE_NAME}</span>
        <span style={{ ...voice("latin", "meta", EDITION_WEIGHTS.label), fontSize: 15 }}>{text.accession}</span>
      </div>
      <div style={{ position: "absolute", left: 64, top: 96, width: 752, borderTop: `2px solid ${ink.rule}` }} />
      {span(EDITION_COPY["ticket-v1"][text.language], { left: 64, top: 114, fontSize: 19, color: ink.stamp, fontFamily: cardFontFamily(text.language, "meta", "og"), fontWeight: EDITION_WEIGHTS.book })}
      {block(layout.quote, layout.regions.quote, voice(text.quoteScript, "text", EDITION_WEIGHTS.ticketQuote))}
      {span(dated, { left: 64, top: 540, fontSize: 15, color: ink.soft, fontFamily: cardFontFamily(text.dateScript, "meta", "og") })}
      {span(shared.languageName[text.language], { left: 416, top: 540, width: 400, fontSize: 15, color: ink.soft, textAlign: "right", fontFamily: cardFontFamily(text.language, "meta", "og") })}
      {span(shared.afterReading[text.language], { left: 912, top: 44, fontSize: 14, color: ink.bg, fontFamily: cardFontFamily(text.language, "meta", "og") })}
      {block(layout.book, layout.regions.book, { ...voice(text.bookScript, "text", EDITION_WEIGHTS.book), color: ink.bg })}
      {block(layout.author, layout.regions.author, { ...voice(text.authorScript, "meta", EDITION_WEIGHTS.author), color: ink.bg })}
      <svg width={264} height={240} viewBox="0 0 264 240" style={{ position: "absolute", left: 908, top: 312 }}>
        <circle cx="132" cy="120" r="112" fill={ink.bg} stroke={ink.stamp} strokeWidth={3} />
      </svg>
      <div style={{ position: "absolute", left: 942, top: 358, width: 196, height: 148, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, color: ink.stamp }}>
        <span style={{ ...voice(text.language, "meta", EDITION_WEIGHTS.label), fontSize: 13 }}>{shared.carriedBy[text.language]}</span>
        <div style={{ width: "100%", display: "flex", flexDirection: "column", ...voice(text.nameScript, "meta", EDITION_WEIGHTS.name), fontSize: layout.name.fontSize, lineHeight: `${layout.name.lineHeight}px` }}>{lines(layout.name, "center")}</div>
      </div>
    </div>, { ...size, fonts });
}
