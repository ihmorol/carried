import type { InkId } from "@/lib/inks";

export type EditionId = "bookplate" | "poster" | "ticket";
export type PreviewLanguage = "en" | "bn";
export type PreviewLine = {
  quote: string;
  name: string;
  book: string;
  author: string;
  date: string;
  accession: string;
  language: PreviewLanguage;
};
export type EditionProps = {
  edition: EditionId;
  content: PreviewLine;
  ink: InkId;
  className?: string;
  stampKey?: number;
};

export const EDITIONS: { id: EditionId; name: string; description: string }[] = [
  { id: "bookplate", name: "Bookplate", description: "An inscription, sealed as yours." },
  { id: "poster", name: "Poster", description: "Your words take the whole page." },
  { id: "ticket", name: "Reader’s ticket", description: "A small keepsake from a book." },
];

export const SAMPLES: Record<PreviewLanguage, { short: PreviewLine; long: PreviewLine }> = {
  en: {
    short: { quote: "A book can close while its question stays open.", name: "Rowan", book: "The Little Prince", author: "Antoine de Saint-Exupéry", date: "09 NOV 2026", accession: "CR·0714", language: "en" },
    long: { quote: "I thought growing up meant having every answer. This book reminded me to keep a little room for wonder, to ask better questions, and to notice the people who make an ordinary day feel like home.", name: "Rowan", book: "The Little Prince", author: "Antoine de Saint-Exupéry", date: "09 NOV 2026", accession: "CR·0714", language: "en" },
  },
  bn: {
    short: { quote: "বইয়ের শেষ পাতা বন্ধ করলেও প্রশ্নটি আমার সঙ্গে থেকে যায়।", name: "রায়হান", book: "পথের পাঁচালী", author: "বিভূতিভূষণ বন্দ্যোপাধ্যায়", date: "০৯ নভেম্বর ২০২৬", accession: "CR·0714", language: "bn" },
    long: { quote: "বড় হওয়া মানে সব প্রশ্নের উত্তর জানা নয়। এই বই আমাকে মনে করিয়ে দিয়েছে, পরিচিত পথেও নতুন কিছু খুঁজে পাওয়া যায়। আর কিছু মানুষ একটি সাধারণ দিনকেও ঘরের মতো আপন করে তোলে।", name: "রায়হান", book: "পথের পাঁচালী", author: "বিভূতিভূষণ বন্দ্যোপাধ্যায়", date: "০৯ নভেম্বর ২০২৬", accession: "CR·0714", language: "bn" },
  },
};
