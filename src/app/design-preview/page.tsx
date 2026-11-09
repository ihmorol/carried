import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DesignBoard } from "@/design-preview/DesignBoard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Card editions and cover-led shelf, design preview",
  robots: { index: false, follow: false },
};

export default function DesignPreviewPage() {
  if (process.env.CARRIED_DESIGN_PREVIEW !== "1") notFound();
  return <DesignBoard />;
}
