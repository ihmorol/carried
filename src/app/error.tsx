"use client";

import Link from "next/link";
import { Header, Footer } from "@/components/Chrome";
import { useLocale } from "@/components/LocaleProvider";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { locale } = useLocale();
  return <><Header /><main id="main-content" className="page-content"><div className="panel mx-auto my-12 max-w-xl"><h1 className="page-title">{locale === "bn" ? "এই পাতাটি খুলতে সমস্যা হয়েছে।" : "This page could not load."}</h1><p className="muted mt-4">{locale === "bn" ? "আবার চেষ্টা করুন। আপনার সংরক্ষিত কথাগুলো এই ডিভাইসেই আছে।" : "Try again. Your saved lines are still on this device."}</p><div className="mt-6 flex flex-wrap gap-3"><button className="ui-button" onClick={reset}>{locale === "bn" ? "আবার চেষ্টা করুন" : "Try again"}</button><Link className="ui-button-secondary" href="/">{locale === "bn" ? "মূল পাতায় ফিরুন" : "Back home"}</Link></div></div></main><Footer /></>;
}
