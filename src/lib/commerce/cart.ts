import { getProduct, getVariant, type ProductSlug } from "./catalog";
import { validateSelection, type Selection } from "./personalization";
import { encodePayload } from "@/lib/line";

export const CART_KEY = "carried.cart.v1";
export const MAX_CART_ITEMS = 30;
export const MAX_QUANTITY = 10;
export type CartInput = Selection & { productSlug: ProductSlug; variant: string; qty: number };
export type CartItem = CartInput & { key: string };
export type CartSnapshot = { items: readonly CartItem[]; persisted: boolean; issue: "corrupt" | null };
export class CartError extends Error {
  constructor(public code: "invalid" | "quantity" | "full" | "missing") { super(code); }
}
export function validateQuantity(value: unknown): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > MAX_QUANTITY) throw new CartError("quantity");
  return value;
}
function validateInput(value: unknown): CartInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new CartError("invalid");
  const data = value as Record<string, unknown>;
  const selection = validateSelection(value);
  const product = typeof data.productSlug === "string" ? getProduct(data.productSlug) : undefined;
  if (!product || typeof data.variant !== "string" || !getVariant(product, data.variant)) throw new CartError("invalid");
  return { ...selection, productSlug: product.slug, variant: data.variant, qty: validateQuantity(data.qty) };
}
/** Exact canonical identity, independent of object property order or quantity. */
export function itemIdentity(value: CartInput): string {
  const data = validateInput(value);
  return JSON.stringify([data.productSlug, data.variant, data.sourceId, data.isExample, encodePayload(data.payload)]);
}
function compactKey(identity: string): string {
  return [0x811c9dc5, 0x9e3779b9, 0x85ebca6b, 0xc2b2ae35].map(seed => {
    let hash = seed;
    for (let i = 0; i < identity.length; i++) { hash ^= identity.charCodeAt(i); hash = Math.imul(hash, 0x01000193) >>> 0; }
    return hash.toString(16).padStart(8, "0");
  }).join("");
}
export function makeCartItem(value: CartInput): CartItem {
  const input = validateInput(value);
  return { ...input, key: compactKey(itemIdentity(input)) };
}
export function validateCart(value: unknown): CartItem[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new CartError("invalid");
  const data = value as Record<string, unknown>;
  if (data.version !== 1 || !Array.isArray(data.items) || data.items.length > MAX_CART_ITEMS) throw new CartError("invalid");
  const keys = new Set<string>();
  return data.items.map(raw => {
    const input = validateInput(raw);
    const item = makeCartItem(input);
    if (raw.key !== item.key || keys.has(item.key)) throw new CartError("invalid");
    keys.add(item.key); return item;
  });
}
type StorageLike = Pick<Storage, "getItem" | "setItem">;
const SERVER_SNAPSHOT: CartSnapshot = { items: [], persisted: true, issue: null };
export function createCartStore(getStorage: () => StorageLike | null) {
  let snapshot: CartSnapshot = SERVER_SNAPSHOT;
  let loaded = false;
  let memoryOnly = false;
  const listeners = new Set<() => void>();
  function emit() { listeners.forEach(listener => listener()); }
  function sync() {
    if (memoryOnly) return;
    loaded = true;
    try {
      const storage = getStorage();
      if (!storage) { memoryOnly = true; snapshot = { ...snapshot, persisted: false }; return; }
      const raw = storage.getItem(CART_KEY);
      try {
        const items = raw ? validateCart(JSON.parse(raw)) : [];
        snapshot = { items, persisted: true, issue: null };
      } catch { snapshot = { items: [], persisted: true, issue: "corrupt" }; }
    } catch { memoryOnly = true; snapshot = { ...snapshot, persisted: false }; }
    emit();
  }
  function current() { if (!loaded) sync(); return snapshot; }
  function commit(items: CartItem[]) {
    let persisted = false;
    if (!memoryOnly) {
      try {
        const storage = getStorage();
        if (!storage) throw new Error("No storage");
        storage.setItem(CART_KEY, JSON.stringify({ version: 1, items })); persisted = true;
      } catch { memoryOnly = true; }
    }
    snapshot = { items, persisted, issue: null }; loaded = true; emit();
    return snapshot;
  }
  return {
    getSnapshot: current,
    getServerSnapshot: () => SERVER_SNAPSHOT,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    sync,
    save(input: CartInput, replaceKey?: string) {
      current();
      // Re-read durable storage before a mutation to avoid stale cross-tab edits.
      if (!memoryOnly) sync();
      const next = makeCartItem(input);
      if (replaceKey && !snapshot.items.some(item => item.key === replaceKey)) throw new CartError("missing");
      const items = snapshot.items.filter(item => item.key !== replaceKey);
      const identity = itemIdentity(next);
      const existing = items.find(item => itemIdentity(item) === identity);
      if (existing) { const qty = validateQuantity(existing.qty + next.qty); commit(items.map(item => item.key === existing.key ? { ...item, qty } : item)); }
      else {
        if (items.length >= MAX_CART_ITEMS) throw new CartError("full");
        if (items.some(item => item.key === next.key)) throw new CartError("invalid");
        commit([...items, next]);
      }
      return snapshot;
    },
    setQuantity(key: string, qty: number) {
      current(); if (!memoryOnly) sync(); validateQuantity(qty);
      if (!snapshot.items.some(item => item.key === key)) throw new CartError("missing");
      commit(snapshot.items.map(item => item.key === key ? { ...item, qty } : item));
    },
    remove(key: string) { current(); if (!memoryOnly) sync(); commit(snapshot.items.filter(item => item.key !== key)); },
  };
}
export const cartStore = createCartStore(() => typeof window === "undefined" ? null : window.localStorage);
