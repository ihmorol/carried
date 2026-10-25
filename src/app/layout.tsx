import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { LocaleProvider } from "@/components/LocaleProvider";

const fraunces = localFont({
  src: [
    { path: "../../public/fonts/Fraunces-500.ttf", weight: "500", style: "normal" },
    { path: "../../public/fonts/Fraunces-600.ttf", weight: "600", style: "normal" },
    { path: "../../public/fonts/Fraunces-Italic-500.ttf", weight: "500", style: "italic" },
  ],
  variable: "--font-fraunces",
  display: "swap",
});

const plex = localFont({
  src: [
    { path: "../../public/fonts/IBMPlexMono-400.ttf", weight: "400", style: "normal" },
    { path: "../../public/fonts/IBMPlexMono-500.ttf", weight: "500", style: "normal" },
    { path: "../../public/fonts/IBMPlexMono-600.ttf", weight: "600", style: "normal" },
  ],
  variable: "--font-plex",
  display: "swap",
});

const notoSerifBengali = localFont({
  src: [
    { path: "../../public/fonts/NotoSerifBengali-500.ttf", weight: "500", style: "normal" },
    { path: "../../public/fonts/NotoSerifBengali-600.ttf", weight: "600", style: "normal" },
    { path: "../../public/fonts/NotoSerifBengali-700.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-noto-serif-bengali",
  display: "swap",
});

const notoSansBengali = localFont({
  src: [
    { path: "../../public/fonts/NotoSansBengali-400.ttf", weight: "400", style: "normal" },
    { path: "../../public/fonts/NotoSansBengali-500.ttf", weight: "500", style: "normal" },
    { path: "../../public/fonts/NotoSansBengali-600.ttf", weight: "600", style: "normal" },
  ],
  variable: "--font-noto-sans-bengali",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — the line a book left in you`,
    template: `%s — ${SITE_NAME}`,
  },
  description:
    "Pick a book. Write the one line it left in you. Stamp it with your name and pass it on. No account needed.",
  openGraph: {
    siteName: SITE_NAME,
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#f2ecdd",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${plex.variable} ${notoSerifBengali.variable} ${notoSansBengali.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LocaleProvider>{children}</LocaleProvider>
        <div className="grain" aria-hidden="true" />
      </body>
    </html>
  );
}
