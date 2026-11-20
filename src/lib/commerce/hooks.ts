"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import { getShelf } from "@/lib/shelf";
import { cartStore, CART_KEY } from "./cart";
import { validateSelection, type Selection } from "./personalization";

export function useCart() {
  const snapshot = useSyncExternalStore(cartStore.subscribe, cartStore.getSnapshot, cartStore.getServerSnapshot);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    Promise.resolve().then(() => { cartStore.sync(); setReady(true); });
    function onStorage(event: StorageEvent) { if (event.key === CART_KEY || event.key === null) cartStore.sync(); }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  return { ...snapshot, ready };
}
export function useShopSelection(initial: Selection | null, example: Selection, invalid = false) {
  const [selection, setSelection] = useState<Selection>(initial ?? example);
  const [saved, setSaved] = useState<Selection[]>([]);
  useEffect(() => {
    let cancelled = false;
    function refresh() {
      const entries = getShelf().flatMap(entry => {
        try { return [validateSelection({ payload: entry.payload, sourceId: entry.id, isExample: false })]; }
        catch { return []; }
      });
      if (!cancelled) setSaved(entries);
      return entries;
    }
    Promise.resolve().then(() => {
      const entries = refresh();
      if (!cancelled && !initial && !invalid && entries[0]) setSelection(entries[0]);
    });
    function onStorage(event: StorageEvent) { if (event.key === "carried.shelf.v1" || event.key === null) refresh(); }
    window.addEventListener("storage", onStorage);
    return () => { cancelled = true; window.removeEventListener("storage", onStorage); };
  }, [initial, invalid]);
  return { selection, setSelection, saved };
}
