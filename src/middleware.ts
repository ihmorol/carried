import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_COOKIE } from "@/lib/i18n";

/**
 * Region-based default language: Bangladesh (Vercel geo) or a Bangla
 * Accept-Language gets the Bangla UI. The reader's own choice (cookie /
 * localStorage via LocaleProvider) always wins after that.
 */
export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  if (!req.cookies.get(LOCALE_COOKIE)) {
    const lang = req.headers.get("accept-language") ?? "";
    const country = req.headers.get("x-vercel-ip-country") ?? "";
    const bn = /^bn\b/i.test(lang) || country === "BD";
    res.cookies.set(LOCALE_COOKIE, bn ? "bn" : "en", {
      path: "/",
      maxAge: 31536000,
      sameSite: "lax",
    });
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|api|favicon|icon|robots|sitemap|.*\\.[\\w]+$).*)"],
};
