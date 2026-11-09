import { describe, expect, it, vi } from "vitest";
import { encodeLine, encodePayload } from "@/lib/line";
import { CATALOG, getProduct, getVariant } from "@/lib/commerce/catalog";
import { parsePersonalization, selectionHref } from "@/lib/commerce/personalization";
import { CART_KEY, MAX_CART_ITEMS, createCartStore, itemIdentity, makeCartItem, validateCart, validateQuantity } from "@/lib/commerce/cart";

const payload = encodeLine({ bookSlug: "the-alchemist", text: "The treasure was never behind the dunes.", name: "Amara", ink: "paper", date: "2026-01-12" }).payload;
const selection = { payload, sourceId: "treasure-behind-dunes-abc12", isExample: false };
const input = { ...selection, productSlug: "art-print" as const, variant: "center", qty: 1 };

function storage() {
  const data = new Map<string, string>();
  return { getItem: vi.fn((key: string) => data.get(key) ?? null), setItem: vi.fn((key: string, value: string) => { data.set(key, value); }) };
}

describe("concept catalog", () => {
  it("has only the five proposed formats, no invented price, and valid default placements", () => {
    expect(CATALOG.map(p => p.slug)).toEqual(["art-print", "bookmark", "tote", "notebook", "mug"]);
    for (const product of CATALOG) {
      expect(product.availability).toBe("concept");
      expect(product.price).toBeUndefined();
      expect(getProduct(product.slug)).toBe(product);
      expect(getVariant(product, product.variants[0].id)).toBe(product.variants[0]);
    }
    expect(getProduct("checkout")).toBeUndefined();
    expect(getVariant(CATALOG[0], "made-up")).toBeUndefined();
  });
});

describe("personalization boundary", () => {
  it("carries the exact line, ink and original accession through a product link", () => {
    const href = selectionHref("/shop/art-print", selection, { variant: "lower" });
    const query = Object.fromEntries(new URL(href, "https://carried.test").searchParams);
    expect(parsePersonalization(query)).toMatchObject({ selection, variant: "lower", issue: null });
  });
  it("rejects duplicate params, bad payloads, missing books and oversized links", () => {
    for (const line of ["garbage", "x".repeat(4097), [encodePayload(payload), encodePayload(payload)], encodePayload({ ...payload, b: "missing-book" })]) {
      expect(parsePersonalization({ line }).issue).toBe("invalid-line");
    }
    expect(parsePersonalization({ line: encodePayload(payload), id: "../../bad" }).issue).toBe("invalid-line");
    expect(parsePersonalization({}).selection).toBeNull();
  });
  it("rejects malformed personalization options instead of turning a broken edit into an append", () => {
    for (const change of [{ variant: "not-real" }, { variant: ["center", "lower"] }, { qty: "11" }, { qty: "1.5" }, { edit: "broken-key" }, { edit: ["a".repeat(32), "b".repeat(32)] }]) {
      expect(parsePersonalization({ line: encodePayload(payload), ...change }).issue).not.toBeNull();
    }
    expect(parsePersonalization({ edit: "a".repeat(32) }).issue).not.toBeNull();
  });
  it("rejects an overlong combined source link before any navigation can crash", () => {
    const encoded = encodePayload(payload);
    expect(parsePersonalization({ line: encoded, id: "a".repeat(4096 - encoded.length) }).issue).toBe("invalid-line");
  });
  it("omits redundant encoded accession ids so long valid links stay transportable", () => {
    const longPayload = { ...payload, q: "আ".repeat(220), b: "reader-book", bt: "ব".repeat(90), ba: "ল".repeat(60), by: 2024 };
    const encoded = encodePayload(longPayload);
    const href = selectionHref("/shop/art-print", { payload: longPayload, sourceId: encoded, isExample: false });
    expect(new URL(href, "https://carried.test").searchParams.has("id")).toBe(false);
    expect(parsePersonalization(Object.fromEntries(new URL(href, "https://carried.test").searchParams)).selection?.sourceId).toBe(encoded);
  });
  it("validates reader-added metadata and Bangla without a server lookup", () => {
    const custom = { ...payload, b: "reader-book", bt: "আমার বই", ba: "লেখক", by: 2024, q: "বইটি আমার সঙ্গে রয়ে গেল।", n: "অনন্যা" };
    expect(parsePersonalization({ line: encodePayload(custom) }).selection?.payload).toEqual(custom);
  });
});

describe("cart validation and identity", () => {
  it("rejects malformed payloads, variants, quantities, keys and schema versions", () => {
    const item = makeCartItem(input);
    expect(validateCart({ version: 1, items: [item] })).toEqual([item]);
    for (const qty of [0, 11, 1.5, NaN, Infinity, "2"]) expect(() => validateQuantity(qty)).toThrow();
    for (const change of [{ qty: 11 }, { payload: null }, { variant: "unknown" }, { productSlug: "fake" }, { key: "forged" }, { sourceId: "<script>" }]) {
      expect(() => validateCart({ version: 1, items: [{ ...item, ...change }] })).toThrow();
    }
    expect(() => validateCart({ version: 99, items: [item] })).toThrow();
    expect(() => validateCart({ version: 1, items: Array(MAX_CART_ITEMS + 1).fill(item) })).toThrow();
  });
  it("rejects duplicate stored identities and arbitrary objects without partial recovery", () => {
    const item = makeCartItem(input);
    for (const raw of [null, [], {}, { version: 1, items: [item, item] }, { version: 1, items: [item, { ...item, payload: false }] }]) {
      expect(() => validateCart(raw)).toThrow();
    }
  });
  it("dedupes exact selections but distinguishes text, name, placement, ink and accession", () => {
    const key = itemIdentity(input);
    expect(itemIdentity({ ...input, qty: 10 })).toBe(key);
    expect(itemIdentity({ ...input, payload: { d: payload.d, n: payload.n, s: payload.s, q: payload.q, b: payload.b, v: 1 } })).toBe(key);
    for (const other of [{ ...input, variant: "lower" }, { ...input, sourceId: "different-accession" }, { ...input, payload: { ...payload, s: "moss" as const } }, { ...input, payload: { ...payload, q: "Another line." } }, { ...input, payload: { ...payload, n: "Someone else" } }]) {
      expect(itemIdentity(other)).not.toBe(key);
    }
  });
});

describe("device-local cart", () => {
  it("persists, notifies, dedupes up to ten and rejects overflow without losing the cart", () => {
    const local = storage(); const store = createCartStore(() => local); const notify = vi.fn();
    const stop = store.subscribe(notify);
    store.save(input); store.save(input);
    expect(store.getSnapshot().items[0].qty).toBe(2);
    store.setQuantity(store.getSnapshot().items[0].key, 10);
    expect(() => store.save(input)).toThrow();
    expect(store.getSnapshot().items[0].qty).toBe(10);
    expect(notify).toHaveBeenCalled();
    expect(createCartStore(() => local).getSnapshot().items).toEqual(store.getSnapshot().items);
    stop();
  });
  it("replaces during edit instead of appending, and merges with an identical existing selection", () => {
    const local = storage(); const store = createCartStore(() => local);
    store.save(input); const old = store.getSnapshot().items[0].key;
    store.save({ ...input, variant: "lower", qty: 2 }, old);
    expect(store.getSnapshot().items).toHaveLength(1);
    expect(store.getSnapshot().items[0]).toMatchObject({ variant: "lower", qty: 2 });
    store.save(input); const initial = store.getSnapshot().items.find(i => i.variant === "center")!;
    store.save({ ...input, variant: "lower" }, initial.key);
    expect(store.getSnapshot().items).toHaveLength(1);
    expect(store.getSnapshot().items[0].qty).toBe(3);
    expect(() => store.save(input, "missing")).toThrow();
  });
  it("supports a valid unchanged edit and continued edits using the updated item key", () => {
    const local = storage(); const store = createCartStore(() => local);
    store.save(input); const first = store.getSnapshot().items[0].key;
    store.save({ ...input, qty: 4 }, first);
    expect(store.getSnapshot().items).toHaveLength(1);
    expect(store.getSnapshot().items[0].qty).toBe(4);
    store.save({ ...input, variant: "lower", qty: 3 }, first);
    const changed = store.getSnapshot().items[0].key;
    store.save({ ...input, variant: "lower", payload: { ...payload, s: "midnight" }, qty: 2 }, changed);
    expect(store.getSnapshot().items).toHaveLength(1);
    expect(store.getSnapshot().items[0]).toMatchObject({ qty: 2, payload: { s: "midnight" } });
  });
  it("keeps an in-memory selection when reading or writing storage is blocked", () => {
    const blocked = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } };
    const store = createCartStore(() => blocked);
    store.save(input); store.save(input);
    expect(store.getSnapshot().items[0].qty).toBe(2);
    expect(store.getSnapshot().persisted).toBe(false);
    const writeOnly = storage(); writeOnly.setItem.mockImplementation(() => { throw new Error("full"); });
    const other = createCartStore(() => writeOnly); other.save(input); other.save(input);
    expect(other.getSnapshot().items[0].qty).toBe(2);
  });
  it("recovers safely from corrupted or unsupported storage and responds to cross-tab changes", () => {
    const local = storage(); local.setItem(CART_KEY, "{broken");
    const store = createCartStore(() => local);
    expect(store.getSnapshot()).toMatchObject({ items: [], issue: "corrupt" });
    store.save(input);
    expect(store.getSnapshot().issue).toBeNull();
    local.setItem(CART_KEY, JSON.stringify({ version: 1, items: [] })); store.sync();
    expect(store.getSnapshot().items).toEqual([]);
    local.setItem(CART_KEY, JSON.stringify({ version: 12, items: [] })); store.sync();
    expect(store.getSnapshot().issue).toBe("corrupt");
  });
  it("enforces max items and removes entries without affecting the others", () => {
    const local = storage(); const store = createCartStore(() => local);
    for (let i = 0; i < MAX_CART_ITEMS; i++) store.save({ ...input, payload: { ...payload, q: `Line ${i}` } });
    expect(() => store.save({ ...input, payload: { ...payload, q: "One more" } })).toThrow();
    store.remove(store.getSnapshot().items[0].key);
    expect(store.getSnapshot().items).toHaveLength(MAX_CART_ITEMS - 1);
  });
});
