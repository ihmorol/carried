export type ProductSlug = "art-print" | "bookmark" | "tote" | "notebook" | "mug";
export type LocalText = { en: string; bn: string };
export type ProductVariant = { id: string; name: LocalText };
export type Product = { slug: ProductSlug; category: ProductSlug; name: LocalText; description: LocalText; availability: "concept"; price: undefined; variants: readonly ProductVariant[] };
const variants: readonly ProductVariant[] = [
  { id: "center", name: { en: "Centered artwork", bn: "মাঝখানে কার্ড" } },
  { id: "lower", name: { en: "Lower placement", bn: "নিচের দিকে কার্ড" } },
];
export const CATALOG: readonly Product[] = [
  { slug: "art-print", category: "art-print", name: { en: "Art print", bn: "আর্ট প্রিন্ট" }, description: { en: "A little room for the line that stayed. Your catalog card, with a generous paper margin.", bn: "যে কথাটি রয়ে গেল, তার জন্য একটু জায়গা। চারপাশে খোলা কাগজের সঙ্গে আপনার কার্ড।" }, availability: "concept", price: undefined, variants },
  { slug: "bookmark", category: "bookmark", name: { en: "Bookmark", bn: "বুকমার্ক" }, description: { en: "Keep your line beside the page. A narrow bookmark concept carrying your whole card.", bn: "পাতার পাশে থাকুক আপনার কথা। পুরো কার্ড নিয়ে সরু একটি বুকমার্কের ধারণা।" }, availability: "concept", price: undefined, variants },
  { slug: "tote", category: "tote", name: { en: "Tote", bn: "টোট ব্যাগ" }, description: { en: "A line to take along. A simple tote concept with your card on the front.", bn: "সঙ্গে নেওয়ার মতো একটি কথা। সামনে আপনার কার্ডসহ সহজ টোট ব্যাগের ধারণা।" }, availability: "concept", price: undefined, variants },
  { slug: "notebook", category: "notebook", name: { en: "Notebook", bn: "নোটবুক" }, description: { en: "One thought on the cover, room for the next inside. A notebook concept for your card.", bn: "প্রচ্ছদে একটি ভাবনা, ভেতরে পরের ভাবনার জায়গা। আপনার কার্ডসহ নোটবুকের ধারণা।" }, availability: "concept", price: undefined, variants },
  { slug: "mug", category: "mug", name: { en: "Mug", bn: "মগ" }, description: { en: "A line beside your reading. A mug concept showing your card on one side.", bn: "পড়ার সময় পাশে থাকুক একটি কথা। এক পাশে আপনার কার্ডসহ মগের ধারণা।" }, availability: "concept", price: undefined, variants },
];
export function getProduct(slug: string, category?: ProductSlug): Product | undefined {
  return CATALOG.find(p => p.slug === slug && (!category || p.category === category));
}
export function getVariant(product: Product, id: string): ProductVariant | undefined {
  return product.variants.find(v => v.id === id);
}
