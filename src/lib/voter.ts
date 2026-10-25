/**
 * The anonymous reader identity: a random id persisted on the device.
 * No accounts, no cookies beyond localStorage, it exists so a vote can
 * be unique per reader, and it never leaves the device except as this
 * meaningless token.
 */
const KEY = "carried.voter.v1";

export function getVoterId(): string {
  if (typeof window === "undefined") return "server-voter";
  try {
    let id = window.localStorage.getItem(KEY);
    if (!id || !/^[A-Za-z0-9-]{8,64}$/.test(id)) {
      const uuid =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `v-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
      id = uuid.slice(0, 40);
      window.localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    // storage blocked, session-scoped identity is better than none
    return `sess-${Math.random().toString(36).slice(2, 12)}`;
  }
}
