import { ImageResponse } from "next/og";
import { loadOgFonts } from "@/lib/og-fonts";
import { SITE_NAME } from "@/lib/site";
import { INKS } from "@/lib/inks";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Carried, the line a book left in you";

export default function OgImage() {
  const fonts = loadOgFonts();
  const ink = INKS.paper;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: ink.bg,
          padding: 26,
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            border: `1.5px solid ${ink.rule}`,
            padding: "64px 80px",
            width: "100%",
          }}
        >
          <span style={{ fontFamily: "Plex", fontWeight: 600, fontSize: 20, letterSpacing: 8, color: ink.soft }}>
            NO ACCOUNT · JUST A LINE
          </span>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span style={{ fontFamily: "Fraunces", fontWeight: 600, fontSize: 96, letterSpacing: 22, color: ink.text, marginLeft: 22 }}>
              {SITE_NAME.toUpperCase()}
            </span>
            <div style={{ width: 90, height: 4, backgroundColor: ink.stamp, marginTop: 34 }} />
            <span style={{ fontFamily: "Fraunces", fontStyle: "italic", fontWeight: 500, fontSize: 34, color: ink.soft, marginTop: 30 }}>
              the line a book left in you
            </span>
          </div>
          {/* spines */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 14 }}>
            {[
              { h: 74, c: INKS.midnight.bg },
              { h: 92, c: INKS.moss.bg },
              { h: 66, c: INKS.midnight.bg },
              { h: 96, c: INKS.moss.bg },
              { h: 78, c: INKS.midnight.bg },
            ].map((s, i) => (
              <div
                key={i}
                style={{
                  width: 44,
                  height: s.h,
                  backgroundColor: s.c,
                  borderRadius: 3,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
