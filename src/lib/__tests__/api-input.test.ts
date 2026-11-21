import { describe, expect, it } from "vitest";
import { readJsonObject, queryLimit } from "@/lib/api-input";
import { StoreError } from "@/lib/store";

/** The API boundary: unreadable bodies and limits answer 400 before any store call. */
function request(value: unknown, fail = false): Request {
  return { json: async () => { if (fail) throw new Error("unreadable"); return value; } } as unknown as Request;
}

describe("api input boundary", () => {
  it("accepts only plain JSON objects as POST bodies", async () => {
    await expect(readJsonObject(request({ q: "A line" }))).resolves.toEqual({ q: "A line" });
    for (const value of [[1, 2], "string", 42, null]) {
      await expect(readJsonObject(request(value))).rejects.toBeInstanceOf(StoreError);
    }
    await expect(readJsonObject(request(undefined, true))).rejects.toMatchObject({ status: 400 });
  });
  it("bounds feed limits to whole numbers inside the maximum", () => {
    expect(queryLimit(null, 200, 200)).toBe(200);
    expect(queryLimit("5", 200, 200)).toBe(5);
    for (const value of ["0", "201", "2.5", "x", "-1"]) {
      expect(() => queryLimit(value, 200, 200)).toThrow(StoreError);
    }
  });
});
