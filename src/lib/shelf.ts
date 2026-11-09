import { LINE_ID_MAX, validateLinePayload, type LinePayload } from "./line";

const SHELF_KEY = "carried.shelf.v1";
const NAME_KEY = "carried.name.v1";
const EVENT = "carried:shelf-change";
let storageBlocked = false;
export type ShelfEntry = { id: string; payload: LinePayload };

function rawShelf(): unknown[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SHELF_KEY);
    storageBlocked = false;
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { storageBlocked = true; return []; }
}
function validEntry(value: unknown): ShelfEntry | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const entry = value as { id?: unknown; payload?: unknown };
  if (typeof entry.id !== "string" || !entry.id || entry.id.length > LINE_ID_MAX || !/^[A-Za-z0-9_-]+$/.test(entry.id)) return null;
  try { return { id: entry.id, payload: validateLinePayload(entry.payload) }; }
  catch { return null; }
}
export function getShelf(): ShelfEntry[] {
  const entries = rawShelf().map(validEntry).filter((e): e is ShelfEntry => e !== null);
  // Do not require getBook: old reader-added short links may lack metadata.
  return [...new Map(entries.map((entry) => [entry.id, entry])).values()].reverse();
}
export function isShelfStorageBlocked(): boolean { return storageBlocked; }
export function subscribeShelf(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  function storage(e: StorageEvent) { if (e.key === SHELF_KEY || e.key === null) listener(); }
  window.addEventListener("storage", storage);
  window.addEventListener(EVENT, listener);
  return () => { window.removeEventListener("storage", storage); window.removeEventListener(EVENT, listener); };
}
export function addToShelf(entry: ShelfEntry): void {
  if (typeof window === "undefined") return;
  const valid = validEntry(entry);
  if (!valid) return;
  const previous = rawShelf();
  // A blocked read must not overwrite a shelf we cannot see.
  if (storageBlocked) { window.dispatchEvent(new Event(EVENT)); return; }
  const shelf = previous.filter((value) => validEntry(value)?.id !== valid.id);
  shelf.push(valid);
  try { window.localStorage.setItem(SHELF_KEY, JSON.stringify(shelf)); storageBlocked = false; }
  catch { storageBlocked = true; }
  window.dispatchEvent(new Event(EVENT));
}
export function getRememberedName(): string {
  if (typeof window === "undefined") return "";
  try { return window.localStorage.getItem(NAME_KEY) ?? ""; } catch { return ""; }
}
export function rememberName(name: string): void {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(NAME_KEY, name); } catch { /* non-fatal */ }
}
