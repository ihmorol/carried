import { LINE_ID_MAX, validateLinePayload, type LinePayload } from "./line";

const SHELF_KEY = "carried.shelf.v1";
const NAME_KEY = "carried.name.v1";
const EVENT = "carried:shelf-change";
let readBlocked = false;
let writeBlocked = false;
export type ShelfEntry = { id: string; payload: LinePayload };
export type ShelfSaveOutcome = Readonly<
  | { status: "saved" }
  | { status: "unavailable"; reason: "read" | "write" }
  | { status: "invalid" }
>;
const SAVED: ShelfSaveOutcome = Object.freeze({ status: "saved" });
const READ_FAILED: ShelfSaveOutcome = Object.freeze({ status: "unavailable", reason: "read" });
const WRITE_FAILED: ShelfSaveOutcome = Object.freeze({ status: "unavailable", reason: "write" });
const INVALID: ShelfSaveOutcome = Object.freeze({ status: "invalid" });

// A navigation receipt cannot rely on the storage write that just failed.
const saveReceipts = new Map<string, ShelfSaveOutcome>();
export function rememberShelfSave(id: string, outcome: ShelfSaveOutcome): void {
  saveReceipts.set(id, outcome);
}
export function consumeShelfSave(id: string): ShelfSaveOutcome | null {
  const outcome = saveReceipts.get(id) ?? null;
  saveReceipts.delete(id);
  return outcome;
}

type ShelfRead = { ok: true; entries: unknown[] } | { ok: false };
function rawShelf(): ShelfRead {
  if (typeof window === "undefined") return { ok: false };
  try {
    const raw = window.localStorage.getItem(SHELF_KEY);
    const parsed: unknown = raw === null ? [] : JSON.parse(raw);
    if (!Array.isArray(parsed)) { readBlocked = true; return { ok: false }; }
    readBlocked = false;
    return { ok: true, entries: parsed };
  } catch { readBlocked = true; return { ok: false }; }
}
function validEntry(value: unknown): ShelfEntry | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const entry = value as { id?: unknown; payload?: unknown };
  if (typeof entry.id !== "string" || !entry.id || entry.id.length > LINE_ID_MAX || !/^[A-Za-z0-9_-]+$/.test(entry.id)) return null;
  try { return { id: entry.id, payload: validateLinePayload(entry.payload) }; }
  catch { return null; }
}
export function getShelf(): ShelfEntry[] {
  const read = rawShelf();
  const entries = (read.ok ? read.entries : []).map(validEntry).filter((e): e is ShelfEntry => e !== null);
  // Do not require getBook: old reader-added short links may lack metadata.
  return [...new Map(entries.map((entry) => [entry.id, entry])).values()].reverse();
}
export function isShelfStorageBlocked(): boolean { return readBlocked || writeBlocked; }
export function subscribeShelf(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  function storage(e: StorageEvent) { if (e.key === SHELF_KEY || e.key === null) listener(); }
  window.addEventListener("storage", storage);
  window.addEventListener(EVENT, listener);
  return () => { window.removeEventListener("storage", storage); window.removeEventListener(EVENT, listener); };
}
export function addToShelf(entry: ShelfEntry): ShelfSaveOutcome {
  const valid = validEntry(entry);
  if (!valid) return INVALID;
  if (typeof window === "undefined") return READ_FAILED;
  const previous = rawShelf();
  // A blocked or malformed read must not overwrite a shelf we cannot see.
  if (!previous.ok) { window.dispatchEvent(new Event(EVENT)); return READ_FAILED; }
  const shelf = previous.entries.filter((value) => validEntry(value)?.id !== valid.id);
  shelf.push(valid);
  let outcome: ShelfSaveOutcome;
  try {
    window.localStorage.setItem(SHELF_KEY, JSON.stringify(shelf));
    writeBlocked = false;
    outcome = SAVED;
  } catch {
    writeBlocked = true;
    outcome = WRITE_FAILED;
  }
  // A synchronous subscriber may read storage here, but cannot turn this
  // operation's immutable result (or the last write failure) into success.
  window.dispatchEvent(new Event(EVENT));
  return outcome;
}
export function getRememberedName(): string {
  if (typeof window === "undefined") return "";
  try { return window.localStorage.getItem(NAME_KEY) ?? ""; } catch { return ""; }
}
export function rememberName(name: string): void {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(NAME_KEY, name); } catch { /* non-fatal */ }
}
