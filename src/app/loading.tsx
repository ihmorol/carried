import { Header, Footer } from "@/components/Chrome";

export default function Loading() {
  return <><Header /><main id="main-content" className="page-content" aria-busy="true"><p role="status" className="muted mb-6">Loading Carried…</p><div className="skeleton mb-6 w-2/3" /><div className="grid gap-6 sm:grid-cols-2"><div className="skeleton min-h-80" /><div className="skeleton min-h-80" /></div></main><Footer /></>;
}
