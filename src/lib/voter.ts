/** Anonymous, device-local vote identity. No accounts or cookies. */
const KEY = "carried.voter.v1";
const VOTES_KEY = "carried.votes.v1";
let transientId: string | undefined;
function createId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `sess-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
}
export function getVoterId(): string {
  if (typeof window === "undefined") return "server-voter";
  try {
    const stored = window.localStorage.getItem(KEY);
    if (stored && /^[A-Za-z0-9-]{8,64}$/.test(stored)) return stored;
    transientId ??= createId();
    window.localStorage.setItem(KEY, transientId);
    return transientId;
  } catch { return transientId ??= createId(); }
}

export type VoteState = { voted?: boolean; votes?: number; busy: boolean };
const empty: VoteState = { busy: false };
const states = new Map<string, VoteState>();
const listeners = new Set<() => void>();
const accepted = new Map<string, boolean>();
function storedVotes(): Record<string, boolean> {
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(VOTES_KEY) ?? "{}");
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return Object.fromEntries(Object.entries(value).filter(([id, v]) => id.length <= 4096 && typeof v === "boolean"));
  } catch { return {}; }
}
function notify() { for (const listener of listeners) listener(); }
export function getVoteState(id: string): VoteState { return states.get(id) ?? empty; }
export function getServerVoteState(): VoteState { return empty; }
export function subscribeVotes(listener: () => void): () => void {
  listeners.add(listener);
  for (const [id, voted] of Object.entries(storedVotes())) {
    if (!states.has(id)) states.set(id, { voted, busy: false });
  }
  function storage(e: StorageEvent) {
    if (e.key !== VOTES_KEY && e.key !== null) return;
    const saved = storedVotes();
    const ids = new Set([...states.keys(), ...Object.keys(saved)]);
    for (const id of ids) {
      const previous = states.get(id) ?? empty;
      if (!previous.busy) states.set(id, { ...previous, voted: saved[id] ?? accepted.get(id) });
    }
    notify();
  }
  window.addEventListener("storage", storage);
  return () => { listeners.delete(listener); window.removeEventListener("storage", storage); };
}
export function beginVote(id: string): boolean {
  const previous = getVoteState(id);
  if (previous.busy) return false;
  states.set(id, { ...previous, busy: true }); notify(); return true;
}
export function finishVote(id: string, votes: number, voted: boolean): void {
  accepted.set(id, voted);
  states.set(id, { votes, voted, busy: false });
  try { window.localStorage.setItem(VOTES_KEY, JSON.stringify({ ...storedVotes(), [id]: voted })); } catch { /* session confirmation stays valid */ }
  notify();
}
export function cancelVote(id: string): void {
  states.set(id, { ...getVoteState(id), busy: false }); notify();
}
export function updateVoteCount(id: string, votes: number): void {
  const previous = getVoteState(id);
  if (previous.busy || previous.votes === votes) return;
  states.set(id, { ...previous, votes }); notify();
}
