import { ImageResponse } from "next/og";
import { getBook, originalName } from "@/lib/books";
import { accessionNo, formatStampDate, formatStampDateBn, isBengali } from "@/lib/line";
import { resolveStyle } from "@/lib/card-style";
import { cardArtSvg, svgDataUri } from "@/lib/card-art";
import { loadOgFonts } from "@/lib/og-fonts";
import { SITE_NAME } from "@/lib/site";
import { findBook, resolveLine } from "@/lib/store";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "A carried line";

/** Landscape cut of the catalog card, what X / WhatsApp / iMessage show.
 * Renders edge to edge like the canvas export; the DOM drop shadow is
 * LineCard page dressing and has no equivalent here. */
export default async function OgImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const payload = await resolveLine(id);
  if (!payload || !(await findBook(payload.b))) {
    return new ImageResponse(<Unreadable />, { ...size, fonts: loadOgFonts() });
  }

  const { ink, pattern, font } = resolveStyle(payload);
  const fonts = loadOgFonts(font);
  const art = cardArtSvg(pattern.id, ink, size.width, size.height);
  const book = getBook(payload.b);
  const origTitle = book ? originalName(book) : "";
  const titleBn = isBengali(origTitle);
  const len = payload.q.length;
  const bn = isBengali(payload.q);
  const quoteSize = Math.round((len > 170 ? 42 : len > 110 ? 50 : len > 60 ? 58 : 64) * (bn ? 0.88 : font.scale));
  const quoteFont = bn
    ? { fontFamily: "Noto Serif Bengali", fontWeight: 500 }
    : { fontFamily: font.family, fontStyle: font.quote.style, fontWeight: font.quote.weight };
  const faceName = { fontFamily: font.family, fontStyle: font.name.style, fontWeight: font.name.weight };
  const stampDate = bn ? formatStampDateBn(payload.d) : formatStampDate(payload.d);
  const nameFont = isBengali(payload.n) || bn
    ? { fontFamily: "Noto Serif Bengali", fontWeight: 600 }
    : faceName;
  const titleFont = titleBn
    ? { fontFamily: "Noto Serif Bengali", fontWeight: 600, fontSize: 32 }
    : { ...faceName, fontSize: Math.round(38 * font.scale) };

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: ink.bg,
          padding: 26,
          position: "relative",
        }}
      >
        {art && (
          <img
            src={svgDataUri(art)}
            width={size.width}
            height={size.height}
            alt=""
            style={{ position: "absolute", top: 0, left: 0 }}
          />
        )}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            border: pattern.frame ? "1.5px solid transparent" : `1.5px solid ${ink.rule}`,
            padding: "54px 64px",
          }}
        >
          {/* head */}
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontFamily: "Fraunces", fontWeight: 600, fontSize: 26, letterSpacing: 10, color: ink.text }}>
              {SITE_NAME.toUpperCase()}
            </span>
            <span style={{ fontFamily: "Plex", fontWeight: 600, fontSize: 20, letterSpacing: 4, color: ink.soft }}>
              NO. {accessionNo(id)}
            </span>
          </div>

          {/* the line */}
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
            }}
          >
            <p
              style={{
                ...quoteFont,
                fontSize: quoteSize,
                lineHeight: bn ? 1.75 : font.leading * (1.35 / 1.5),
                color: ink.text,
                margin: 0,
              }}
            >
              “{payload.q}”
            </p>
          </div>

          {/* provenance + stamp */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontFamily: "Plex", fontWeight: 600, fontSize: 17, letterSpacing: 6, color: ink.soft }}>
                CARRIED OUT OF
              </span>
              <span style={{ ...titleFont, color: ink.text, marginTop: 10 }}>
                {origTitle}
              </span>
              <span style={{ fontFamily: "Plex", fontSize: 19, color: ink.soft, marginTop: 8 }}>
                {book ? `${book.author} · ${book.year < 0 ? `${Math.abs(book.year)} BC` : book.year}` : ""}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                border: `4px solid ${ink.stamp}`,
                borderRadius: 10,
                padding: "16px 26px",
                color: ink.stamp,
                transform: "rotate(-5deg)",
              }}
            >
              <span style={{ fontFamily: "Plex", fontWeight: 600, fontSize: 15, letterSpacing: 6 }}>
                CARRIED BY
              </span>
              <span style={{ ...nameFont, fontSize: Math.round(34 * (nameFont === faceName ? font.scale : 1)), marginTop: 6 }}>
                {payload.n}
              </span>
              <span style={{ fontFamily: "Plex", fontWeight: 500, fontSize: 14, letterSpacing: 4, marginTop: 6 }}>
                {stampDate}
              </span>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}

function Unreadable() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f2ecdd",
      }}
    >
      <span style={{ fontFamily: "Fraunces", fontWeight: 600, fontSize: 48, letterSpacing: 12, color: "#211d17" }}>
        {SITE_NAME.toUpperCase()}
      </span>
    </div>
  );
}
