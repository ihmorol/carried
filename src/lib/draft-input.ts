import { LINE_MAX, NAME_MAX } from "./site";

export type DraftIssue = "empty" | "too-long" | null;

/** Raw form state stays with the editor. Validation mirrors the codec/API's
 * normalized UTF-16 string lengths; only valid fields enter a card proof. */
export function inspectDraftInput(text: string, name: string) {
  const q = text.trim().replace(/\s+/g, " ");
  const n = name.trim().replace(/\s+/g, " ");
  const lineIssue: DraftIssue = !q ? "empty" : q.length > LINE_MAX ? "too-long" : null;
  const nameIssue: DraftIssue = !n ? "empty" : n.length > NAME_MAX ? "too-long" : null;
  return {
    q, n,
    lineLength: q.length,
    nameLength: n.length,
    lineIssue, nameIssue,
    proofLine: lineIssue ? null : q,
    proofName: nameIssue ? null : n,
  };
}
