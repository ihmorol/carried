import { StoreError } from "./store";

export async function readJsonObject(req: Request): Promise<Record<string, unknown>> {
  try {
    const value: unknown = await req.json();
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("object required");
    return value as Record<string, unknown>;
  } catch {
    throw new StoreError("Send readable JSON fields.", 400);
  }
}

export function queryLimit(value: string | null, fallback: number, max: number): number {
  if (value === null) return fallback;
  const limit = Number(value);
  if (!Number.isInteger(limit) || limit < 1 || limit > max) throw new StoreError(`Choose a limit from 1 to ${max}.`, 400);
  return limit;
}
