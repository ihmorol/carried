import { CATALOG } from "./catalog";
import { bookForPayload } from "@/lib/books";
import { decodeLine, encodePayload, LINE_ID_MAX, validateLinePayload, type LinePayload } from "@/lib/line";

export type Selection = { payload: LinePayload; sourceId: string; isExample: boolean };
export type ShopQuery = Record<string, string | string[] | undefined>;
export type Personalization = { selection: Selection | null; issue: "invalid-line" | null; variant?: string; editKey?: string; qty?: number };
export function safeSourceId(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= LINE_ID_MAX && /^[a-zA-Z0-9_-]+$/.test(value);
}
export function validateSelection(value: unknown): Selection {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid selection");
  const data = value as Record<string, unknown>;
  const payload = validateLinePayload(data.payload);
  if (!bookForPayload(payload) || !safeSourceId(data.sourceId) || typeof data.isExample !== "boolean") throw new Error("Invalid selection");
  const selection = { payload, sourceId: data.sourceId, isExample: data.isExample };
  // Reserve room for the longest product path and cart-edit parameters.
  // Every accepted selection must remain navigable, including URL-only source IDs.
  selectionHref("/shop/art-print", selection, { variant: "center", edit: "0".repeat(32), qty: 10 });
  return selection;
}
export function parsePersonalization(query: ShopQuery): Personalization {
  try {
    if (query.line === undefined) {
      if (["id", "example", "variant", "edit", "qty"].some(key => query[key] !== undefined)) throw new Error("Incomplete link");
      return { selection: null, issue: null };
    }
    if (typeof query.line !== "string" || (query.id !== undefined && !safeSourceId(query.id)) || (query.example !== undefined && query.example !== "1")) throw new Error("Invalid link");
    const payload = decodeLine(query.line);
    const selection = validateSelection({ payload, sourceId: query.id ?? encodePayload(payload), isExample: query.example === "1" });
    if (query.variant !== undefined && (typeof query.variant !== "string" || !CATALOG.some(product => product.variants.some(variant => variant.id === query.variant)))) throw new Error("Unknown placement");
    if (query.edit !== undefined && (typeof query.edit !== "string" || !/^[a-f0-9]{32}$/.test(query.edit))) throw new Error("Invalid edit key");
    if (query.qty !== undefined && (typeof query.qty !== "string" || !/^(?:[1-9]|10)$/.test(query.qty))) throw new Error("Invalid quantity");
    const variant = query.variant as string | undefined;
    const editKey = query.edit as string | undefined;
    const qty = query.qty === undefined ? undefined : Number(query.qty);
    const combined = Object.values(query).reduce<number>((n, v) => n + (typeof v === "string" ? v.length : 0), 0);
    if (combined > LINE_ID_MAX) throw new Error("Link too long");
    return { selection, issue: null, variant, editKey, qty };
  } catch { return { selection: null, issue: "invalid-line" }; }
}
export function selectionHref(path: string, selection: Selection | null, extra: { variant?: string; edit?: string; qty?: number } = {}): string {
  const query = new URLSearchParams();
  if (selection) {
    const encoded = encodePayload(selection.payload);
    query.set("line", encoded);
    if (selection.sourceId !== encoded) query.set("id", selection.sourceId);
    if (selection.isExample) query.set("example", "1");
  }
  if (extra.variant) query.set("variant", extra.variant);
  if (extra.edit) query.set("edit", extra.edit);
  if (extra.qty) query.set("qty", String(extra.qty));
  const href = query.size ? `${path}?${query}` : path;
  if (href.length > LINE_ID_MAX) throw new Error("Link too long");
  return href;
}
