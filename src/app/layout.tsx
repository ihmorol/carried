import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "./workspace.css";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { LocaleProvider } from "@/components/LocaleProvider";

const manrope = localFont({
  src: [
    { path: "../../public/fonts/Manrope-400.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/Manrope-500.woff2", weight: "500", style: "normal" },
    { path: "../../public/fonts/Manrope-600.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-manrope",
  display: "swap",
});

const anekBangla = localFont({
  src: [
    { path: "../../public/fonts/AnekBangla-400.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/AnekBangla-500.woff2", weight: "500", style: "normal" },
    { path: "../../public/fonts/AnekBangla-600.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-anek-bangla",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME}, the line a book left in you`,
    template: `%s, ${SITE_NAME}`,
  },
  description: "Pick a book. Write the one line it left in you. Stamp it with your name and pass it on. No account needed.",
  openGraph: { siteName: SITE_NAME, type: "website" },
};

export const viewport: Viewport = { themeColor: "#f1f1e7" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${manrope.variable} ${anekBangla.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col"><LocaleProvider>{children}</LocaleProvider></body>
    </html>
  );
}
