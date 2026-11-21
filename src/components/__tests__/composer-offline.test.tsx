// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Composer } from "../Composer";
import { LocaleProvider } from "../LocaleProvider";
import { BOOKS } from "@/lib/books";
import { decodeLine } from "@/lib/line";
import { getShelf } from "@/lib/shelf";

/**
 * The composer's offline promise: when the live shelf is unreachable the
 * reader still gets a link-only card; only rate limiting stops the stamp.
 */

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams(window.location.search),
}));
vi.mock("../LineCard", () => ({ LineCard: ({ payload }: { payload: { q: string } }) => <div>{payload.q}</div> }));

const wrap = (ui: React.ReactNode) => render(<LocaleProvider>{ui}</LocaleProvider>);
const flush = () => act(async () => { await Promise.resolve(); });

beforeEach(() => {
  window.localStorage.clear();
  window.localStorage.setItem("carried-locale", "en");
  window.history.replaceState(null, "", "/b/the-alchemist");
  vi.clearAllMocks();
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ books: [], lines: [], live: false }) }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

async function stamp() {
  wrap(<Composer book={BOOKS[0]} />); await flush();
  fireEvent.change(screen.getByLabelText("01. The line it left in you"), { target: { value: "Offline line stays readable." } });
  fireEvent.change(screen.getByLabelText("02. Sign it"), { target: { value: "Mira" } });
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Stamp it & pass it on" })); });
}

describe("composer offline fallback", () => {
  it("mints a link-only card when the live shelf is unreachable (502/503)", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 503 } as unknown as Response);
    await stamp();
    expect(push).toHaveBeenCalledTimes(1);
    const id = (push.mock.calls[0][0] as string).slice(3);
    expect(decodeLine(id)).toMatchObject({ q: "Offline line stays readable.", n: "Mira", b: BOOKS[0].slug });
    expect(getShelf().map((entry) => entry.id)).toContain(id);
    expect(screen.queryByRole("alert")).toBeNull();
  });
  it("mints a link-only card when the network itself fails", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("offline"));
    await stamp();
    expect(push).toHaveBeenCalledTimes(1);
    const id = (push.mock.calls[0][0] as string).slice(3);
    expect(decodeLine(id)).toMatchObject({ q: "Offline line stays readable.", n: "Mira" });
    expect(screen.queryByRole("alert")).toBeNull();
  });
  it("stops a rate-limited stamp with the retry message and no navigation", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 429 } as unknown as Response);
    await stamp();
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toMatch(/shelf needs a moment/i);
    expect(getShelf()).toEqual([]);
  });
  it("publishes the server's canonical id and payload when the shelf accepts the line", async () => {
    const serverPayload = { v: 1, b: BOOKS[0].slug, q: "Offline line stays readable.", n: "Mira", s: "paper", d: "2026-11-21" };
    vi.mocked(fetch).mockResolvedValueOnce({ ok: true, status: 201, json: async () => ({ id: "sheep-follow-chooses-k3f2", payload: serverPayload, live: true }) } as unknown as Response);
    await stamp();
    expect(push).toHaveBeenCalledWith("/l/sheep-follow-chooses-k3f2");
    const saved = getShelf().find((entry) => entry.id === "sheep-follow-chooses-k3f2");
    expect(saved?.payload.q).toBe("Offline line stays readable.");
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
