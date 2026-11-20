export type ProductSlug = "quote-card" | "bookmark" | "bookplate-set" | "framed-print" | "gift-set" | "club-pack";
export type LocalText = { en: string; bn: string };
export type ProductVariant = { id: string; name: LocalText };
export type Product = { slug: ProductSlug; category: ProductSlug; name: LocalText; description: LocalText; availability: "concept"; price: undefined; variants: readonly ProductVariant[] };
/* Flat placements describe where the whole card proof sits on each proposal.
   Names describe arrangement only; no material, size, or price is claimed. */
const flatVariants: readonly ProductVariant[] = [
  { id: "center", name: { en: "Centered artwork", bn: "মাঝখানে কার্ড" } },
  { id: "lower", name: { en: "Lower placement", bn: "নিচের দিকে কার্ড" } },
];
const plateVariants: readonly ProductVariant[] = [
  { id: "sheet", name: { en: "Full sheet", bn: "পুরো শিট" } },
  { id: "single", name: { en: "Single plate", bn: "একটি প্লেট" } },
];
const boxVariants: readonly ProductVariant[] = [
  { id: "open", name: { en: "Open box", bn: "খোলা বাক্স" } },
  { id: "closed", name: { en: "Closed box", bn: "বন্ধ বাক্স" } },
];
const packVariants: readonly ProductVariant[] = [
  { id: "stacked", name: { en: "Stacked", bn: "একের উপর এক" } },
  { id: "spread", name: { en: "Fanned out", bn: "পাশে পাশে" } },
];
/* The planned assortment follows the physical-products business plan:
   quote card, bookmark, bookplate set, framed print, gift set, club pack.
   Ordering is not open and every price/spec remains a launch decision. */
export const CATALOG: readonly Product[] = [
  { slug: "quote-card", category: "quote-card", name: { en: "Quote card", bn: "কোট কার্ড" }, description: { en: "Your line, printed as the card you made it — your own copy to keep or give.", bn: "আপনার কথাই, আপনার বানানো কার্ডেই ছাপা — রাখার বা দেওয়ার জন্য নিজের একটি কপি।" }, availability: "concept", price: undefined, variants: flatVariants },
  { slug: "bookmark", category: "bookmark", name: { en: "Bookmark", bn: "বুকমার্ক" }, description: { en: "Keep your line beside the page. A narrow bookmark concept carrying your whole card.", bn: "পাতার পাশে থাকুক আপনার কথা। পুরো কার্ড নিয়ে সরু একটি বুকমার্কের ধারণা।" }, availability: "concept", price: undefined, variants: flatVariants },
  { slug: "bookplate-set", category: "bookplate-set", name: { en: "Bookplate set", bn: "বুকপ্লেট সেট" }, description: { en: "Small plates for the books on your own shelf, each carrying your line where a library stamp once went.", bn: "নিজের তাকের বইগুলোর জন্য ছোট ছোট প্লেট — যেখানে একসময় লাইব্রেরির সিল বসত, সেখানেই আপনার কথা।" }, availability: "concept", price: undefined, variants: plateVariants },
  { slug: "framed-print", category: "framed-print", name: { en: "Framed print", bn: "ফ্রেম করা প্রিন্ট" }, description: { en: "The line leaves the shelf for the wall. Your card, framed for a reading room or a doorway.", bn: "কথাটি তাক ছেড়ে দেয়ালে যায়। পড়ার ঘর বা দরজার কাছে ফ্রেমে বাঁধা আপনার কার্ড।" }, availability: "concept", price: undefined, variants: flatVariants },
  { slug: "gift-set", category: "gift-set", name: { en: "Gift set", bn: "উপহার সেট" }, description: { en: "Your line packed to be given — cards, a bookmark, and bookplates together in one box.", bn: "উপহার দেওয়ার জন্য ভরা আপনার কথা — এক বাক্সে কার্ড, একটি বুকমার্ক আর বুকপ্লেট।" }, availability: "concept", price: undefined, variants: boxVariants },
  { slug: "club-pack", category: "club-pack", name: { en: "Book club pack", bn: "বুক ক্লাব প্যাক" }, description: { en: "One card in many copies — for a book club, a classroom, or a stall at the book fair.", bn: "একটি কার্ডের অনেক কপি — বুক ক্লাব, ক্লাসরুম বা বইয়ের মেলার স্টলের জন্য।" }, availability: "concept", price: undefined, variants: packVariants },
];
export function getProduct(slug: string, category?: ProductSlug): Product | undefined {
  return CATALOG.find(p => p.slug === slug && (!category || p.category === category));
}
export function getVariant(product: Product, id: string): ProductVariant | undefined {
  return product.variants.find(v => v.id === id);
}
