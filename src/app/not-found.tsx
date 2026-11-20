import Link from "next/link";
import { BookOpen } from "@phosphor-icons/react/dist/ssr";
import { Header, Footer } from "@/components/Chrome";
import { T } from "@/components/T";

export default function NotFound() {
  return <><Header /><main id="main-content" className="page-content flex flex-1 flex-col items-center py-16"><div className="panel w-full max-w-lg"><BookOpen size={32} weight="regular" aria-hidden="true" className="text-[var(--color-stamp)]" /><h1 className="section-title mt-5"><T k="nf.title" /></h1><p className="muted mt-3"><T k="nf.sub" /></p><Link href="/#shelf" className="ui-button mt-6"><T k="nf.cta" /></Link></div></main><Footer /></>;
}
