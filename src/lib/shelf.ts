import type { LinePayload } from "./line";

/**
 * "My lines", the reader's own shelf, local to their device.
 * No accounts anywhere on this site; the only memory we keep is theirs.
 */

const SHELF_KEY = "carried.shelf.v1";
const NAME_KEY = "carried.name.v1";

export type ShelfEntry = { id: string; payload: LinePayload };

function readShelf(): ShelfEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SHELF_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is ShelfEntry =>
        !!e &&
        typeof e === "object" &&
        typeof (e as ShelfEntry).id === "string" &&
        !!(e as ShelfEntry).payload,
    );
  } catch {
    return [];
  }
}

export function getShelf(): ShelfEntry[] {
  return readShelf().reverse(); // newest first
}

export function addToShelf(entry: ShelfEntry): void {
  if (typeof window === "undefined") return;
  const shelf = readShelf().filter((e) => e.id !== entry.id);
  shelf.push(entry);
  try {
    window.localStorage.setItem(SHELF_KEY, JSON.stringify(shelf.slice(-200)));
  } catch {
    /* storage full or blocked, the link itself still carries the line */
  }
}

export function getRememberedName(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(NAME_KEY) ?? "";
  } catch {
    return "";
  }
}

export function rememberName(name: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(NAME_KEY, name);
  } catch {
    /* non-fatal */
  }
}
