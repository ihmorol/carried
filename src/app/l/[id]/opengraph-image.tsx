import { ImageResponse } from "next/og";
import { accessionNo } from "@/lib/line";
import { EDITION_COPY, EDITION_SHARED_COPY, EDITION_WEIGHTS, cardFontFamily, cardPresentation } from "@/lib/card-presentation";
import { EDITION_OG, layoutEditionOg, type EditionOgLayout, type EditionText, type TextFit } from "@/lib/text-layout";
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

/** Landscape cuts of the three editions: each keeps its identity (bookplate
 * frame + oval, poster band + angled stamp, ticket stub + cancellation) with
 * the full bilingual text fitted at readable floors, never truncated. */
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
  const layout = layoutEditionOg(text, content.edition);
  const shared = EDITION_SHARED_COPY;
  const dated = `${shared.dated[text.language]} ${text.date}`;
  const sans = (script: typeof content.quoteScript, weight: CSSProperties["fontWeight"]): CSSProperties =>
    ({ fontFamily: cardFontFamily(script, "serif", "og"), fontWeight: weight });
  const lines = (fit: TextFit) => fit.lines.map((line, index) => (
    <span key={index} style={{ height: fit.lineHeight, whiteSpace: "pre" }}>{line.replace(/[\r\n]/g, "")}</span>
  ));
  const block = (fit: TextFit, region: EditionOgLayout["regions"]["quote"], style: CSSProperties) => (
    <div style={{ position: "absolute", left: region.x, top: region.y, width: region.width, display: "flex", flexDirection: "column", ...style,
      fontSize: fit.fontSize, lineHeight: `${fit.lineHeight}px` }}>
      {lines(fit)}
    </div>
  );
  const span = (value: string, style: CSSProperties & { left?: number; top?: number; right?: number; fontSize?: number }) => (
    <span style={{ position: "absolute", fontFamily: cardFontFamily("latin", "serif", "og"), fontWeight: EDITION_WEIGHTS.label, ...style }}>{value}</span>
  );

  if (content.edition === "bookplate-v1") {
    return new ImageResponse(
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", backgroundColor: ink.bg, color: ink.text }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0 }}>
          <path fill="none" stroke={ink.text} strokeWidth={2}
            d="M48 18H1152V34H1180V596H1152V612H48V596H20V34H48Z" />
          <path fill="none" stroke={ink.text} strokeWidth={1}
            d="M55 25H1145V41H1173V589H1145V605H55V589H27V41H55Z" />
          <path fill="none" stroke={ink.text} strokeWidth={1.4}
            d="M76 18H44V6M1124 18H1156V6M76 612H44V624M1124 612H1156V624" />
          <path fill={ink.text} stroke="none" d="M600 12L605 18L600 24L595 18ZM600 606L605 612L600 618L595 612Z" />
        </svg>
        <div style={{ position: "absolute", left: 0, right: 0, top: 46, textAlign: "center", ...sans("latin", EDITION_WEIGHTS.wordmark), fontSize: 34, lineHeight: 1.1 }}>{SITE_NAME}</div>
        {span(EDITION_COPY["bookplate-v1"][text.language], { left: 0, right: 0, top: 90, fontSize: 17, color: ink.soft, textAlign: "center", fontFamily: cardFontFamily(text.language, "serif", "og") })}
        {span(text.accession, { right: 56, top: 60, fontSize: 15, color: ink.soft })}
        {block(layout.quote, layout.regions.quote, { ...sans(text.quoteScript, EDITION_WEIGHTS.quote), textAlign: "center" })}
        {span(shared.afterReading[text.language], { left: 140, top: 390, width: 920, fontSize: 15, color: ink.soft, textAlign: "center", fontFamily: cardFontFamily(text.language, "serif", "og") })}
        {block(layout.book, layout.regions.book, { ...sans(text.bookScript, EDITION_WEIGHTS.book), textAlign: "center" })}
        {block(layout.author, layout.regions.author, { ...sans(text.authorScript, EDITION_WEIGHTS.author), color: ink.soft, textAlign: "center" })}
        <div style={{ position: "absolute", left: 370, top: 504, width: 460, height: 96, border: `3px solid ${ink.stamp}`, borderRadius: "50%", color: ink.stamp }} />
        <div style={{ position: "absolute", left: 376, top: 510, width: 448, height: 84, border: `1.5px solid ${ink.stamp}`, borderRadius: "50%" }} />
        {span(shared.carriedBy[text.language], { left: 414, top: 514, width: 372, fontSize: 14, color: ink.stamp, textAlign: "center", fontFamily: cardFontFamily(text.language, "serif", "og") })}
        {block(layout.name, layout.regions.name, { ...sans(text.nameScript, EDITION_WEIGHTS.name), color: ink.stamp, textAlign: "center" })}
        {span(dated, { left: 414, top: 574, width: 372, fontSize: 14, color: ink.stamp, textAlign: "center", fontFamily: cardFontFamily(text.dateScript, "serif", "og") })}
      </div>, { ...size, fonts });
  }

  if (content.edition === "poster-v1") {
    const fieldColor = ink.id === "midnight" ? ink.bg : ink.text;
    const textColor = ink.id === "midnight" ? ink.text : ink.bg;
    return new ImageResponse(
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", backgroundColor: fieldColor, color: textColor }}>
        <div style={{ position: "absolute", left: 88, top: 46, ...sans("latin", EDITION_WEIGHTS.wordmark), fontSize: 36, lineHeight: 1.2 }}>{SITE_NAME}</div>
        {span(text.accession, { right: 88, top: 54, fontSize: 17, color: textColor })}
        {block(layout.quote, layout.regions.quote, sans(text.quoteScript, EDITION_WEIGHTS.posterQuote))}
        {span(shared.afterReading[text.language], { left: 88, top: 418, fontSize: 15, color: textColor, fontFamily: cardFontFamily(text.language, "serif", "og") })}
        {block(layout.book, layout.regions.book, sans(text.bookScript, EDITION_WEIGHTS.book))}
        {block(layout.author, layout.regions.author, { ...sans(text.authorScript, EDITION_WEIGHTS.author), color: textColor })}
        <div style={{ position: "absolute", left: 0, right: 0, top: 510, bottom: 0, backgroundColor: ink.stamp, overflow: "hidden", display: "flex" }}>
          <span style={{ position: "absolute", left: 50, top: -130, fontSize: 300, fontWeight: 600, lineHeight: 1, color: fieldColor }}>”</span>
        </div>
        <div style={{ position: "absolute", left: 728, top: 440, width: 400, height: 140, transform: "rotate(-6deg)", backgroundColor: ink.bg,
          border: `3px solid ${ink.stamp}`, color: ink.stamp, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5, textAlign: "center" }}>
          <span style={{ ...sans(text.language, EDITION_WEIGHTS.label), fontSize: 14 }}>{shared.carriedBy[text.language]}</span>
          <div style={{ ...sans(text.nameScript, EDITION_WEIGHTS.name), fontSize: layout.name.fontSize, lineHeight: `${layout.name.lineHeight}px`, maxWidth: 336, display: "flex", flexDirection: "column", alignItems: "center" }}>
            {lines(layout.name)}
          </div>
          <span style={{ ...sans(text.dateScript, EDITION_WEIGHTS.label), fontSize: 14 }}>{dated}</span>
        </div>
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
      <div style={{ position: "absolute", left: 64, top: 44, ...sans("latin", EDITION_WEIGHTS.wordmark), fontSize: 32, lineHeight: 1.2 }}>{SITE_NAME}</div>
      {span(text.accession, { left: 64, top: 52, width: 752, fontSize: 15, color: ink.text, textAlign: "right" })}
      <div style={{ position: "absolute", left: 64, top: 96, width: 752, borderTop: `2px solid ${ink.rule}` }} />
      {span(EDITION_COPY["ticket-v1"][text.language], { left: 64, top: 114, fontSize: 19, color: ink.stamp, fontFamily: cardFontFamily(text.language, "serif", "og"), fontWeight: EDITION_WEIGHTS.book })}
      {block(layout.quote, layout.regions.quote, sans(text.quoteScript, EDITION_WEIGHTS.ticketQuote))}
      {span(dated, { left: 64, top: 540, fontSize: 15, color: ink.soft, fontFamily: cardFontFamily(text.dateScript, "serif", "og") })}
      {span(shared.languageName[text.language], { left: 416, top: 540, width: 400, fontSize: 15, color: ink.soft, textAlign: "right", fontFamily: cardFontFamily(text.language, "serif", "og") })}
      {span(shared.afterReading[text.language], { left: 912, top: 44, fontSize: 14, color: ink.bg, fontFamily: cardFontFamily(text.language, "serif", "og") })}
      {block(layout.book, layout.regions.book, { ...sans(text.bookScript, EDITION_WEIGHTS.book), color: ink.bg })}
      {block(layout.author, layout.regions.author, { ...sans(text.authorScript, EDITION_WEIGHTS.author), color: ink.bg })}
      <svg width={264} height={240} viewBox="0 0 264 240" style={{ position: "absolute", left: 908, top: 312 }}>
        <circle cx="132" cy="120" r="118" fill={ink.bg} stroke={ink.stamp} strokeWidth={5} />
        <circle cx="132" cy="120" r="105" fill="none" stroke={ink.stamp} strokeWidth={2.5} />
        <path fill="none" stroke={ink.stamp} strokeWidth={2.5} d="M0 108H14M0 120H14M0 132H14M250 108H264M250 120H264M250 132H264" />
      </svg>
      {span(shared.carriedBy[text.language], { left: 940, top: 364, width: 200, fontSize: 13, color: ink.stamp, textAlign: "center", fontFamily: cardFontFamily(text.language, "serif", "og") })}
      {block(layout.name, layout.regions.name, { ...sans(text.nameScript, EDITION_WEIGHTS.name), color: ink.stamp, textAlign: "center" })}
    </div>, { ...size, fonts });
}
