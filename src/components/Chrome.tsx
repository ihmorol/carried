"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Books, BookmarkSimple, PencilLine, Tote, List, ArrowUpRight } from "@phosphor-icons/react";
import { useLocale } from "./LocaleProvider";
import { LocaleToggle } from "./T";
import { SITE_NAME } from "@/lib/site";

export function Header() {
  const pathname = usePathname();
  const { t, locale } = useLocale();
  const shop = locale === "bn" ? "দোকান" : "Shop";
  const links = [
    { href: "/", label: locale === "bn" ? "মূল পাতা" : "Home", icon: BookOpen, active: pathname === "/" },
    { href: "/#shelf", label: t("nav.shelf"), icon: Books, active: pathname.startsWith("/b/") },
    { href: "/shelf", label: t("nav.myLines"), icon: BookmarkSimple, active: pathname === "/shelf" },
    { href: "/shop", label: shop, icon: Tote, active: pathname.startsWith("/shop") },
  ];

  return (
    <>
      <a className="skip-link" href="#main-content">{locale === "bn" ? "মূল বিষয়বস্তুতে যান" : "Skip to content"}</a>
      <aside className="navigation-rail" aria-label={locale === "bn" ? "মূল নেভিগেশন" : "Main navigation"}>
        <Link href="/" className="rail-brand" aria-label={`${SITE_NAME} home`}><BookOpen size={32} weight="light" /><span>Carried</span></Link>
        <nav className="rail-links">
          {links.map(({ href, label, icon: Icon, active }) => (
            <Link key={href} href={href} className={`rail-link${active ? " is-active" : ""}`} aria-current={active ? "page" : undefined}>
              <Icon size={23} weight={active ? "fill" : "regular"} aria-hidden="true" /><span>{label}</span>
            </Link>
          ))}
        </nav>
        <Link href="/#shelf" className="rail-write"><PencilLine size={22} aria-hidden="true" /><span>{t("nav.write")}</span></Link>
        <p className="rail-note">{locale === "bn" ? "আপনার বই। আপনার কথা।" : "Your books.\nYour words."}</p>
      </aside>
      <header className="site-header">
        <div className="header-inner">
          <Link href="/" className="header-wordmark" aria-label={`${SITE_NAME} home`}>CARRIED<span>{t("brand.tagline")}</span></Link>
          <div className="header-actions">
            <span className="header-free">{locale === "bn" ? "ডিজিটাল কার্ড সবসময় বিনামূল্যে" : "Digital cards, always free"}</span>
            <LocaleToggle />
            <details className="mobile-navigation">
              <summary aria-label={locale === "bn" ? "মেনু খুলুন" : "Open menu"}><List size={23} /><span>{locale === "bn" ? "মেনু" : "Menu"}</span></summary>
              <nav aria-label="Main navigation">
                {links.map(({ href, label, icon: Icon, active }) => <Link key={href} href={href} aria-current={active ? "page" : undefined}><Icon size={20} aria-hidden="true" />{label}</Link>)}
                <Link href="/#shelf"><PencilLine size={20} aria-hidden="true" />{t("nav.write")}</Link>
              </nav>
            </details>
          </div>
        </div>
      </header>
    </>
  );
}

export function Footer() {
  const { t, locale } = useLocale();
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <p className="footer-signature">{t("brand.tagline")}</p>
        <nav aria-label="Footer">
          <Link href="/#shelf">{t("footer.pick")}</Link>
          <Link href="/shelf">{t("footer.mine")}</Link>
          <Link href="/shop">{locale === "bn" ? "দোকান" : "Shop"}</Link>
          <a href="https://github.com/ihmorol/carried" target="_blank" rel="noopener noreferrer">{t("footer.source")}<ArrowUpRight size={14} aria-hidden="true" /></a>
        </nav>
      </div>
    </footer>
  );
}
