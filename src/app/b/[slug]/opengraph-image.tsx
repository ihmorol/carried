import { ImageResponse } from "next/og";
import { BOOKS, originalName } from "@/lib/books";
import { findBook } from "@/lib/store";
import { loadOgFonts } from "@/lib/og-fonts";
import { cardFontFamily, cardScript } from "@/lib/card-presentation";
import { estimateTextWidth, fitText } from "@/lib/text-layout";
import { INKS } from "@/lib/inks";
import { SITE_NAME } from "@/lib/site";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "A book on the Carried shelf";

export function generateStaticParams() { return BOOKS.map((book) => ({ slug: book.slug })); }

export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const fonts = loadOgFonts();
  const book = await findBook(slug);
  const paper = INKS.paper;
  const cloth = INKS.moss;
  if (!book) return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: paper.bg }}>
      <span style={{ fontFamily: "Fraunces", fontWeight: 600, fontSize: 48, letterSpacing: 12, color: paper.text }}>{SITE_NAME.toUpperCase()}</span>
    </div>, { ...size, fonts });
  const title = originalName(book);
  const author = book.authorBn ?? book.author;
  const titleScript = cardScript(title);
  const authorScript = cardScript(author);
  const titleFit = fitText(title, { width: 300, height: 260, maxFontSize: 42, minFontSize: 20,
    leading: titleScript === "bengali" ? 1.65 : 1.3, measure: (text, size) => estimateTextWidth(text, size) });
  const authorFit = fitText(author, { width: 300, height: 120, maxFontSize: 21, minFontSize: 16,
    leading: 1.65, measure: (text, size) => estimateTextWidth(text, size, "mono") });
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", backgroundColor: paper.bg }}>
      <div style={{ width: 380, height: "100%", backgroundColor: cloth.bg, color: cloth.text, display: "flex", position: "relative",
        flexDirection: "column", alignItems: "center", justifyContent: "space-between", padding: "54px 40px" }}>
        <div style={{ position: "absolute", left: 18, top: 18, width: 344, height: 594, border: `1px solid ${cloth.rule}` }} />
        <div style={{ position: "absolute", left: 24, top: 24, width: 332, height: 582, border: `1px solid ${cloth.rule}` }} />
        <div style={{ width: 220, height: 4, backgroundColor: cloth.rule }} />
        <div style={{ width: 300, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", fontFamily: cardFontFamily(titleScript, "serif", "og"),
            fontWeight: 600, fontSize: titleFit.fontSize, lineHeight: `${titleFit.lineHeight}px`, textAlign: "center" }}>
            {titleFit.lines.map((line, index) => <span key={index} style={{ whiteSpace: "pre", height: titleFit.lineHeight }}>{line}</span>)}
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", fontFamily: cardFontFamily(authorScript, "mono", "og"),
            fontSize: authorFit.fontSize, lineHeight: `${authorFit.lineHeight}px`, marginTop: 22, color: cloth.soft }}>
            {authorFit.lines.map((line, index) => <span key={index} style={{ whiteSpace: "pre", height: authorFit.lineHeight }}>{line}</span>)}
          </div>
        </div>
        <span style={{ fontFamily: "Plex", fontSize: 18, color: cloth.soft }}>{book.year < 0 ? `${Math.abs(book.year)} BC` : book.year}</span>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "70px 64px" }}>
        <span style={{ fontFamily: "Plex", fontWeight: 600, fontSize: 22, letterSpacing: 8, color: paper.soft }}>{SITE_NAME.toUpperCase()}</span>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontFamily: "Fraunces", fontWeight: 600, fontSize: 64, lineHeight: 1.2, color: paper.text }}>What line did it leave in you?</span>
          <span style={{ fontFamily: "Plex", fontSize: 22, lineHeight: 1.5, color: paper.soft, marginTop: 26 }}>Write the sentence you’d underline.</span>
        </div>
        <span style={{ fontFamily: "Plex", fontSize: 19, letterSpacing: 3, color: paper.stamp }}>NO ACCOUNT · JUST A LINE</span>
      </div>
    </div>, { ...size, fonts });
}
