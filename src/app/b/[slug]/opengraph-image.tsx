import { ImageResponse } from "next/og";
import { BOOKS, bookTagline, SPINE_COLORS } from "@/lib/books";
import { findBook } from "@/lib/store";
import { loadOgFonts } from "@/lib/og-fonts";
import { SITE_NAME } from "@/lib/site";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "A book on the Carried shelf";

export function generateStaticParams() {
  return BOOKS.map((b) => ({ slug: b.slug }));
}

export default async function OgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const fonts = loadOgFonts();
  const book = await findBook(slug);
  if (!book) {
    return new ImageResponse(
      (
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
      ),
      { ...size, fonts },
    );
  }

  const spine = SPINE_COLORS[book.spine];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          backgroundColor: "#f2ecdd",
        }}
      >
        {/* the spine */}
        <div
          style={{
            width: 330,
            height: "100%",
            backgroundColor: spine.bg,
            color: spine.text,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "60px 30px",
          }}
        >
          <div style={{ width: 34, height: 8, backgroundColor: "rgba(0,0,0,0.18)" }} />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontFamily: "Fraunces",
                fontWeight: 600,
                fontSize: book.title.length > 24 ? 34 : 42,
                lineHeight: 1.2,
                textAlign: "center",
              }}
            >
              {book.title}
            </span>
            <span
              style={{
                fontFamily: "Plex",
                fontSize: 20,
                marginTop: 22,
                opacity: 0.85,
              }}
            >
              {book.author}
            </span>
          </div>
          <span style={{ fontFamily: "Plex", fontSize: 18, opacity: 0.7 }}>
            {book.year < 0 ? `${Math.abs(book.year)} BC` : book.year}
          </span>
        </div>

        {/* the invitation */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "70px 80px",
          }}
        >
          <span
            style={{
              fontFamily: "Plex",
              fontWeight: 600,
              fontSize: 22,
              letterSpacing: 8,
              color: "#6d6354",
            }}
          >
            {SITE_NAME.toUpperCase()}
          </span>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontFamily: "Fraunces",
                fontWeight: 600,
                fontSize: 64,
                lineHeight: 1.15,
                color: "#211d17",
                maxWidth: 720,
              }}
            >
              What line did it leave in you?
            </span>
            <span style={{ fontFamily: "Plex", fontSize: 22, color: "#6d6354", marginTop: 26 }}>
              {bookTagline(book)} — write the sentence you&rsquo;d underline.
            </span>
          </div>
          <span style={{ fontFamily: "Plex", fontSize: 19, letterSpacing: 3, color: "#b23c25" }}>
            NO ACCOUNT · JUST A LINE
          </span>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
