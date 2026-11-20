import { ImageResponse } from "next/og";
import { EDITION_COPY, EDITION_SHARED_COPY, EDITION_WEIGHTS, cardFontFamily, cardPresentation, editionText, type CardFontRole } from "@/lib/card-presentation";
import { EDITION_OG, layoutEditionOg, type CardRegion, type TextFit } from "@/lib/text-layout";
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

/** Explicit landscape editions, not stretched portrait cards. The open
 * Bookplate, poster band and ticket cancellation share the measured content
 * contract, including the full author/year credit and independent scripts. */
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
  const r = layout.regions;
  const shared = EDITION_SHARED_COPY;
  const dated = `${shared.dated[text.language]} ${text.date}`;
  const voice = (script: typeof content.quoteScript, role: CardFontRole, weight: CSSProperties["fontWeight"]): CSSProperties =>
    ({ fontFamily: cardFontFamily(script, role, "og"), fontWeight: weight });
  const block = (fit: TextFit, region: CardRegion, style: CSSProperties) => (
    <div style={{ position: "absolute", left: region.x, top: region.y, width: region.width, height: fit.height,
      display: "flex", flexDirection: "column", ...style, fontSize: fit.fontSize, lineHeight: `${fit.lineHeight}px` }}>
      {fit.lines.map((line, index) => <span key={index} style={{ width: "100%", height: fit.lineHeight, flexShrink: 0,
        display: "flex", justifyContent: style.textAlign === "center" ? "center" : "flex-start", whiteSpace: "pre" }}>
        {line.replace(/[\r\n\u2060]/gu, " ").trim()}
      </span>)}
    </div>
  );
  const span = (value: string, style: CSSProperties) => (
    <span style={{ position: "absolute", display: "flex", lineHeight: 1.3,
      justifyContent: style.textAlign === "center" ? "center" : style.textAlign === "right" ? "flex-end" : "flex-start",
      ...voice("latin", "meta", EDITION_WEIGHTS.label), ...style }}>{value}</span>
  );
  const at = (region: CardRegion): CSSProperties => ({ left: region.x, top: region.y, width: region.width, height: region.height });
  const credit = (color: string, soft = color) => <>
    {span(shared.afterReading[text.language], { ...at(r.creditLabel), fontSize: content.edition === "ticket-v1" ? 14 : 15,
      color: soft, ...voice(text.language, "meta", EDITION_WEIGHTS.label) })}
    {block(layout.book, r.book, { ...voice(text.bookScript, "text", EDITION_WEIGHTS.book), color })}
    {block(layout.author, r.author, { ...voice(text.authorScript, "meta", EDITION_WEIGHTS.author), color: soft })}
  </>;

  if (content.edition !== "ticket-v1") {
    const poster = content.edition === "poster-v1";
    const field = poster && ink.id !== "midnight" ? ink.text : ink.bg;
    const foreground = poster && ink.id !== "midnight" ? ink.bg : ink.text;
    const soft = poster ? foreground : ink.soft;
    // The Bookplate carries the landscape header's hairline too: under the
    // wordmark box (top 40 + 30 × 1.2) with the shared 8px gap, at the same
    // 64px inset as the portrait rule's print-space furniture.
    const headerRuleTop = 40 + 30 * 1.2 + 8;
    return new ImageResponse(
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", backgroundColor: field, color: foreground }}>
        <div style={{ position: "absolute", left: 64, top: 40, display: "flex", ...voice("latin", "text", EDITION_WEIGHTS.wordmark), fontSize: 30, lineHeight: 1.2 }}>{SITE_NAME}</div>
        {span(text.accession, { right: 64, top: 52, fontSize: 16, color: soft })}
        {!poster && <div style={{ position: "absolute", left: 64, width: W - 128, top: headerRuleTop, borderTop: `1px solid ${ink.rule}` }} />}
        {block(layout.quote, r.quote, voice(text.quoteScript, "text", poster ? EDITION_WEIGHTS.posterQuote : EDITION_WEIGHTS.quote))}
        {credit(foreground, soft)}
        {poster && <div style={{ position: "absolute", left: 0, right: 0, top: layout.bandTop, bottom: 0, backgroundColor: ink.stamp, display: "flex" }} />}
        {span(shared.carriedBy[text.language], { ...at(r.readerLabel), fontSize: 14, color: poster ? ink.bg : ink.soft,
          ...voice(text.language, "meta", EDITION_WEIGHTS.label) })}
        {block(layout.name, r.name, { ...voice(text.nameScript, "meta", EDITION_WEIGHTS.name), color: poster ? ink.bg : ink.text })}
        {!poster && <div style={{ position: "absolute", ...at(r.signature), borderTop: `3px solid ${ink.stamp}` }} />}
        {span(dated, { ...at(r.date), fontSize: 14, color: poster ? ink.bg : ink.soft, ...voice(text.dateScript, "meta", EDITION_WEIGHTS.date) })}
      </div>, { ...size, fonts });
  }

  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", color: ink.text }}>
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
      {span(EDITION_COPY["ticket-v1"][text.language], { left: 64, top: 114, fontSize: 19, color: ink.stamp, ...voice(text.language, "meta", EDITION_WEIGHTS.book) })}
      {block(layout.quote, r.quote, voice(text.quoteScript, "text", EDITION_WEIGHTS.ticketQuote))}
      {span(dated, { ...at(r.date), fontSize: 15, color: ink.soft, ...voice(text.dateScript, "meta", EDITION_WEIGHTS.date) })}
      {credit(ink.bg)}
      <svg width={264} height={240} viewBox="0 0 264 240" style={{ position: "absolute", left: 908, top: 328 }}>
        <circle cx="132" cy="120" r="112" fill={ink.bg} stroke={ink.stamp} strokeWidth={3} />
      </svg>
      {span(shared.carriedBy[text.language], { ...at(r.readerLabel), fontSize: 13, color: ink.stamp,
        textAlign: "center", ...voice(text.language, "meta", EDITION_WEIGHTS.label) })}
      {block(layout.name, r.name, { ...voice(text.nameScript, "meta", EDITION_WEIGHTS.name), color: ink.stamp, textAlign: "center" })}
    </div>, { ...size, fonts });
}
