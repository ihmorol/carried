// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { StrictMode } from "react";
import { HeroSearch } from "../HeroSearch";
import { Composer } from "../Composer";
import { ShelfExplorer } from "../ShelfExplorer";
import { LinesFeed } from "../LinesFeed";
import { RecentFeed } from "../RecentFeed";
import { ShareRow } from "../ShareRow";
import { UnderlineButton } from "../UnderlineButton";
import { LineActions } from "../LineActions";
import { BookCover } from "../BookCover";
import { LocaleProvider, useLocale } from "../LocaleProvider";
import { BookLinks } from "../BookLinks";
import { LinePicker } from "../shop/LinePicker";
import ShelfPage from "@/app/shelf/page";
import LinePage from "@/app/l/[id]/page";
import { BOOKS } from "@/lib/books";
import { decodeLine, encodePayload } from "@/lib/line";
import { addToShelf, getShelf, isShelfStorageBlocked, subscribeShelf } from "@/lib/shelf";
import type { Selection } from "@/lib/commerce/personalization";
import { getVoterId } from "@/lib/voter";
import { usePoll } from "@/lib/use-poll";
import { translate } from "@/lib/i18n";
import { parsePersonalization } from "@/lib/commerce/personalization";
import { MemoryStore } from "@/lib/store";

const { push, download, proofFault } = vi.hoisted(() => ({ push: vi.fn(), download: vi.fn(), proofFault: { target: null as "main" | "thumbnails" | null } }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams(window.location.search),
  notFound: () => { throw new Error("NEXT_NOT_FOUND"); },
}));
vi.mock("../Chrome", () => ({ Header: () => null, Footer: () => null }));
vi.mock("../BookSpine", () => ({ BookSpine: () => <span data-testid="spine" /> }));
vi.mock("../FrontCover", () => ({ FrontCover: () => <span data-testid="cover" /> }));
vi.mock("../LineCard", () => ({ LineCard: ({ payload, id }: { payload: { q: string; bt?: string }; id?: string }) => {
  const thumbnail = typeof id === "string" && id.startsWith("design-");
  if (proofFault.target === (thumbnail ? "thumbnails" : "main")) throw new RangeError("proof test fault");
  return <div data-testid={thumbnail ? "card-thumb" : "card"}>{payload.q}<span>{payload.bt}</span></div>;
} }));
vi.mock("@/lib/canvas", () => ({ downloadLineCard: download, lineCardBlob: vi.fn().mockResolvedValue(null) }));
const payload = { v: 1 as const, b: BOOKS[0].slug, q: "What stayed", n: "Reader", s: "paper" as const, d: "2026-11-09" };
const seed = { ...payload, id: "seed-line" };
const wrap = (ui: React.ReactNode) => render(<LocaleProvider>{ui}</LocaleProvider>);
const flush = () => act(async () => { await Promise.resolve(); });
const globalStore = globalThis as typeof globalThis & { __carriedStore?: unknown };

beforeEach(() => {
  window.localStorage.clear();
  window.localStorage.setItem("carried-locale", "en");
  window.history.replaceState(null, "", "/");
  vi.clearAllMocks();
  proofFault.target = null;
  globalStore.__carriedStore = new MemoryStore();
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ books: [], lines: [], live: false }) }));
});
afterEach(() => { cleanup(); delete globalStore.__carriedStore; vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("interaction regressions", () => {
  it("selects search options by click and exposes the active descendant", async () => {
    wrap(<HeroSearch />); await flush();
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "alchemist" } });
    const option = screen.getByRole("option");
    expect(input.getAttribute("aria-activedescendant")).toBe(option.id);
    fireEvent.click(option);
    expect(push).toHaveBeenCalledWith("/b/the-alchemist#write");
  });
  it("includes reader book metadata in live proof and uses native ink radios", async () => {
    wrap(<Composer book={{ ...BOOKS[0], slug: "reader-book", title: "Reader Book" }} />); await flush();
    expect(screen.getByTestId("card").textContent).toContain("Reader Book");
    expect(screen.getAllByRole("radio").every((el) => el.tagName === "INPUT")).toBe(true);
  });
  it("limits the initial shelf to 24 books and combines query with tags", async () => {
    wrap(<ShelfExplorer />); await flush();
    expect(screen.getAllByTestId("cover")).toHaveLength(24);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "Orwell" } });
    fireEvent.click(screen.getByRole("button", { name: "poetry" }));
    expect(screen.queryAllByTestId("cover")).toHaveLength(0);
    expect((screen.getByRole("searchbox") as HTMLInputElement).value).toBe("Orwell");
  });
  it("does not expose add-book fields before live connection is confirmed", async () => {
    vi.mocked(fetch).mockImplementation(() => new Promise(() => {}));
    wrap(<ShelfExplorer />); await flush();
    fireEvent.click(screen.getByRole("button", { name: "+ Add a book" }));
    expect(screen.queryByLabelText("Title")).toBeNull();
    expect(screen.getByRole("status").textContent).toMatch(/connect|Checking/i);
  });
  it("resets book feed immediately when the slug changes", async () => {
    vi.mocked(fetch).mockImplementation(() => new Promise(() => {}));
    const view = wrap(<LinesFeed slug={payload.b} seeds={[seed]} />); await flush();
    view.rerender(<LocaleProvider><LinesFeed slug="another-book" seeds={[{ ...seed, b: "another-book", q: "New book", id: "new-line" }]} /></LocaleProvider>);
    expect(screen.getByTestId("card").textContent).toBe("New book");
  });
  it("shows only three static editorial recent cards", async () => {
    wrap(<RecentFeed seeds={Array.from({ length: 5 }, (_, i) => ({ ...seed, id: `line-${i}` }))} />); await flush();
    expect(screen.getAllByTestId("card")).toHaveLength(3);
    expect(screen.getByText(/editorial/i)).toBeTruthy();
    expect(document.querySelector(".animate-marquee")).toBeNull();
  });
  it("takes new vote counts from props and synchronizes duplicate controls", async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => ({ votes: 8, voted: true }) } as Response);
    const view = wrap(<UnderlineButton lineId="vote-line" initialVotes={2} />); await flush();
    view.rerender(<LocaleProvider><UnderlineButton lineId="vote-line" initialVotes={7} /><UnderlineButton lineId="vote-line" initialVotes={7} /></LocaleProvider>); await flush();
    expect(screen.getAllByRole("button")[0].textContent).toContain("7");
    await act(async () => { fireEvent.click(screen.getAllByRole("button")[0]); });
    expect(screen.getAllByRole("button").every((el) => el.getAttribute("aria-pressed") === "true")).toBe(true);
  });
  it("keeps count summaries synchronized across duplicate controls, polls, and busy votes", async () => {
    let resolve!: (response: Response) => void;
    vi.mocked(fetch).mockImplementationOnce(() => new Promise<Response>((done) => { resolve = done; }));
    const onChange = vi.fn();
    const view = wrap(<><LineActions lineId="summary-busy" initialVotes={5} onChange={onChange} /><LineActions lineId="summary-busy" initialVotes={5} /></>); await flush();
    expect(screen.getAllByText("underlined ×5")).toHaveLength(2);
    fireEvent.click(screen.getAllByRole("button")[0]);
    view.rerender(<LocaleProvider><LineActions lineId="summary-busy" initialVotes={30} onChange={onChange} /><LineActions lineId="summary-busy" initialVotes={30} /></LocaleProvider>); await flush();
    expect(screen.getAllByRole("button").every((button) => button.textContent?.includes("· 5"))).toBe(true);
    expect(screen.getAllByText("underlined ×5")).toHaveLength(2);
    await act(async () => { resolve({ ok: true, json: async () => ({ votes: 6, voted: true }) } as Response); });
    expect(screen.getAllByText("underlined ×6")).toHaveLength(2);
    expect(screen.getAllByRole("button").every((button) => button.textContent?.includes("· 6"))).toBe(true);
    expect(onChange).toHaveBeenCalledWith("summary-busy", 6, true);
    view.rerender(<LocaleProvider><LineActions lineId="summary-busy" initialVotes={31} language="bn" /><LineActions lineId="summary-busy" initialVotes={31} language="bn" /></LocaleProvider>); await flush();
    expect(screen.getAllByText("আন্ডারলাইন ×31")).toHaveLength(2);
    expect(screen.getAllByRole("button").every((button) => button.textContent?.includes("· 31"))).toBe(true);
  });
  it("keeps one transient voter identity when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
    expect(getVoterId()).toBe(getVoterId());
  });
  it("validates stored payloads while retaining legacy reader entries", () => {
    window.localStorage.setItem("carried.shelf.v1", JSON.stringify([{ id: "valid-short", payload: { ...payload, b: "legacy-reader-book" } }, { id: "bad", payload: { ...payload, s: "broken" } }]));
    expect(getShelf().map((e) => e.id)).toEqual(["valid-short"]);
  });
  it("does not overlap polls and aborts the active request on unmount", async () => {
    vi.useFakeTimers();
    let signal: AbortSignal | undefined;
    const poll = vi.fn((s: AbortSignal) => { signal = s; return new Promise<void>(() => {}); });
    function Probe() { usePoll(poll, 100); return null; }
    const view = render(<Probe />);
    await act(async () => { await vi.advanceTimersByTimeAsync(400); });
    expect(poll).toHaveBeenCalledTimes(1);
    view.unmount();
    expect(signal?.aborted).toBe(true);
  });
  it("recovers the cover after its source changes", () => {
    const view = render(<BookCover src="/missing.jpg" book={BOOKS[0]} />);
    fireEvent.error(screen.getByRole("img"));
    view.rerender(<BookCover src="/new.jpg" book={BOOKS[0]} />);
    expect(screen.getByRole("img").getAttribute("src")).toBe("/new.jpg");
  });
  it("updates copied URL when card id changes and exposes clipboard fallback", async () => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: vi.fn().mockRejectedValue(new Error("blocked")) } });
    const view = wrap(<ShareRow payload={payload} id="old-id" />); await flush();
    view.rerender(<LocaleProvider><ShareRow payload={payload} id="new-id" /></LocaleProvider>); await flush();
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Copy link" })); });
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(`${window.location.origin}/l/new-id`);
    expect((screen.getByRole("textbox") as HTMLInputElement).value).toContain("/l/new-id");
  });
  it("reports download failures rather than dropping rejection", async () => {
    download.mockRejectedValue(new Error("render failed"));
    wrap(<ShareRow payload={payload} id="line-id" />); await flush();
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Save the card" })); });
    expect(screen.getByRole("alert").textContent).toMatch(/card|print/i);
  });
  it("supports keyboard option selection and closes the list on Escape", async () => {
    wrap(<HeroSearch />); await flush();
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "Orwell" } });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(input.getAttribute("aria-activedescendant")).toBe(screen.getAllByRole("option")[1].id);
    fireEvent.keyDown(input, { key: "Enter" });
    expect(push).toHaveBeenCalled();
    fireEvent.change(input, { target: { value: "Orwell" } });
    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.queryByRole("listbox")).toBeNull();
  });
  it("shows field-level composer errors without posting whitespace", async () => {
    wrap(<Composer book={BOOKS[0]} />); await flush();
    fireEvent.change(screen.getByLabelText("01. The line it left in you"), { target: { value: "  " } });
    fireEvent.click(screen.getByRole("button", { name: "Stamp it & pass it on" }));
    expect(screen.getAllByRole("alert")).toHaveLength(2);
    expect(fetch).not.toHaveBeenCalled();
  });
  it("pages all shelf results and resets pagination with filters", async () => {
    wrap(<ShelfExplorer />); await flush();
    fireEvent.click(screen.getByRole("button", { name: "Show 24 more books" }));
    expect(screen.getAllByTestId("cover")).toHaveLength(48);
    fireEvent.click(screen.getByRole("button", { name: "fiction" }));
    expect(screen.getAllByTestId("cover")).toHaveLength(24);
    expect(new URL(window.location.href).searchParams.get("genre")).toBe("fiction");
  });
  it("aborts and ignores a previous slug's late feed response", async () => {
    let resolve!: (response: Response) => void;
    let oldSignal: AbortSignal | undefined;
    vi.mocked(fetch).mockImplementationOnce((_url, init) => { oldSignal = init?.signal as AbortSignal; return new Promise<Response>((done) => { resolve = done; }); });
    const view = wrap(<LinesFeed slug={payload.b} seeds={[seed]} />); await flush();
    view.rerender(<LocaleProvider><LinesFeed slug="another-book" seeds={[{ ...seed, b: "another-book", q: "New book", id: "new-line" }]} /></LocaleProvider>); await flush();
    expect(oldSignal?.aborted).toBe(true);
    await act(async () => { resolve({ ok: true, json: async () => ({ live: true, lines: [{ id: "late", payload: { ...payload, q: "Stale old line" }, t: 1, votes: 9 }] }) } as Response); });
    expect(screen.queryByText("Stale old line")).toBeNull();
    expect(screen.getByRole("status").textContent).not.toContain(" · live");
  });
  it("keeps busy vote counts stable when a parent poll updates", async () => {
    let resolve!: (response: Response) => void;
    vi.mocked(fetch).mockImplementationOnce(() => new Promise<Response>((done) => { resolve = done; }));
    const view = wrap(<UnderlineButton lineId="busy-line" initialVotes={5} />); await flush();
    fireEvent.click(screen.getByRole("button"));
    view.rerender(<LocaleProvider><UnderlineButton lineId="busy-line" initialVotes={30} /></LocaleProvider>); await flush();
    expect(screen.getByRole("button").textContent).toContain("· 5");
    await act(async () => { resolve({ ok: true, json: async () => ({ votes: 6, voted: true }) } as Response); });
    expect(screen.getByRole("button").textContent).toContain("· 6");
  });
  it("returns a failed shelf write that a synchronous subscriber cannot erase", () => {
    window.localStorage.setItem("carried.shelf.v1", JSON.stringify([{ id: "original-line", payload }]));
    const setItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, key, value) {
      if (key === "carried.shelf.v1") throw new DOMException("quota", "QuotaExceededError");
      setItem.call(this, key, value);
    });
    const observed: boolean[] = [];
    const stop = subscribeShelf(() => { getShelf(); observed.push(isShelfStorageBlocked()); });
    try {
      const outcome = addToShelf({ id: "failed-write", payload });
      expect(outcome).toEqual({ status: "unavailable", reason: "write" });
      expect(Object.isFrozen(outcome)).toBe(true);
      expect(observed).toEqual([true]);
      expect(getShelf().map((entry) => entry.id)).toEqual(["original-line"]);
      expect(isShelfStorageBlocked()).toBe(true);
      window.localStorage.setItem("carried.name.v1", "Mira");
      expect(isShelfStorageBlocked()).toBe(true);
    } finally { stop(); }
  });
  it("never overwrites an unreadable shelf, even when writes still work", () => {
    const original = JSON.stringify([{ id: "original-line", payload }]);
    window.localStorage.setItem("carried.shelf.v1", original);
    const getItem = Storage.prototype.getItem;
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(function (this: Storage, key) {
      if (key === "carried.shelf.v1") throw new Error("blocked read");
      return getItem.call(this, key);
    });
    const write = vi.spyOn(Storage.prototype, "setItem");
    expect(addToShelf({ id: "must-not-overwrite", payload })).toEqual({ status: "unavailable", reason: "read" });
    expect(write).not.toHaveBeenCalled();
    expect(getItem.call(window.localStorage, "carried.shelf.v1")).toBe(original);
  });
  it("does not overwrite malformed top-level shelf data", () => {
    for (const raw of ['{"futureShelf":[]}', "{unreadable", "null"]) {
      window.localStorage.setItem("carried.shelf.v1", raw);
      expect(addToShelf({ id: "must-not-overwrite", payload })).toEqual({ status: "unavailable", reason: "read" });
      expect(window.localStorage.getItem("carried.shelf.v1")).toBe(raw);
    }
  });
  it("rejects invalid entries and clears the last write failure only after a successful save", () => {
    const write = vi.spyOn(Storage.prototype, "setItem");
    expect(addToShelf({ id: "bad/id", payload })).toEqual({ status: "invalid" });
    expect(write).not.toHaveBeenCalled();
    expect(addToShelf({ id: "successful-line", payload })).toEqual({ status: "saved" });
    expect(isShelfStorageBlocked()).toBe(false);
    expect(getShelf().map((entry) => entry.id)).toEqual(["successful-line"]);
  });
  it("notifies shelf observers and preserves malformed storage entries", () => {
    const malformed = { id: "bad-entry", payload: { broken: true } };
    window.localStorage.setItem("carried.shelf.v1", JSON.stringify([malformed]));
    const observer = vi.fn(); const stop = subscribeShelf(observer);
    addToShelf({ id: "fresh-line", payload });
    expect(observer).toHaveBeenCalledTimes(1);
    expect(JSON.parse(window.localStorage.getItem("carried.shelf.v1")!)).toContainEqual(malformed);
    window.dispatchEvent(new StorageEvent("storage", { key: "carried.shelf.v1" }));
    expect(observer).toHaveBeenCalledTimes(2); stop();
  });
  it("uses browser fallback when locale storage is blocked and never creates a cookie", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
    Object.defineProperty(navigator, "languages", { configurable: true, value: ["bn-BD"] });
    const cookieWrite = vi.spyOn(document, "cookie", "set");
    function Switch() { const { locale, setLocale } = useLocale(); return <button onClick={() => setLocale("en")}>{locale}</button>; }
    wrap(<Switch />); await flush();
    expect(screen.getByRole("button").textContent).toBe("bn");
    fireEvent.click(screen.getByRole("button"));
    expect(cookieWrite).not.toHaveBeenCalled();
  });
  it("treats native share cancellation as silent but reports real errors", async () => {
    const share = vi.fn().mockRejectedValueOnce(new DOMException("cancelled", "AbortError")).mockRejectedValueOnce(new Error("unavailable"));
    Object.defineProperty(navigator, "share", { configurable: true, value: share });
    wrap(<ShareRow payload={payload} id="native-share" />); await flush();
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Share…" })); });
    expect(screen.queryByRole("alert")).toBeNull();
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Share…" })); });
    expect(screen.getByRole("alert").textContent).toContain("could not be shared");
  });
  it("labels resolved archive links by their actual origin", async () => {
    wrap(<BookLinks book={BOOKS[0]} workUrl="https://archive.org/details/book" />); await flush();
    expect(screen.queryByRole("link", { name: /Open Library/ })).toBeNull();
    expect(screen.getAllByRole("link", { name: /Internet Archive/ })).toHaveLength(2);
  });
  it("renders a readable legacy shelf entry instead of silently losing its card", async () => {
    window.localStorage.setItem("carried.shelf.v1", JSON.stringify([{ id: "old-reader-line", payload: { ...payload, b: "legacy-reader-book" } }]));
    wrap(<ShelfPage />); await flush();
    expect(screen.getByText("What stayed")).toBeTruthy();
    expect(screen.getByRole("link").getAttribute("href")).toBe("/l/old-reader-line");
    expect(screen.getByText(/Saved before/)).toBeTruthy();
  });
  it("searches reader-added books using the same core search", async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => ({ books: [{ ...BOOKS[0], slug: "reader-native", title: "পাঠকের বই", tags: ["reader-added"] }], live: true }) } as Response);
    wrap(<HeroSearch />); await flush();
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "পাঠকের" } });
    fireEvent.click(screen.getByRole("option"));
    expect(push).toHaveBeenCalledWith("/b/reader-native#write");
  });
  it("repairs Bengali step labels and translates new main page keys", () => {
    expect(translate("bn", "c.1")).toMatch(/^০১\./);
    expect(translate("bn", "c.2")).toMatch(/^০২\./);
    expect(translate("en", "home.welcome")).toBe("A book ends. A line stays.");
  });
});

describe("proof error isolation", () => {
  it.each(["main", "thumbnails"] as const)("keeps the editor and draft mounted when %s rendering fails", async (target) => {
    // The deliberate child error is handled by the real boundary; report it
    // through React's test root hook rather than muting console warnings.
    const caught = vi.fn();
    render(<LocaleProvider><Composer book={BOOKS[0]} /></LocaleProvider>, { onCaughtError: caught }); await flush();
    const line = screen.getByLabelText("01. The line it left in you") as HTMLTextAreaElement;
    const name = screen.getByLabelText("02. Sign it") as HTMLInputElement;
    fireEvent.change(line, { target: { value: "My draft stays here." } });
    fireEvent.change(name, { target: { value: "Mira" } });
    proofFault.target = target;
    fireEvent.click(screen.getByRole("radio", { name: "Moss" }));
    expect(line.isConnected).toBe(true);
    expect(line.value).toBe("My draft stays here.");
    expect(name.value).toBe("Mira");
    expect(screen.getByRole("status").textContent).toMatch(/preview.*unavailable|proof.*unavailable/i);
    proofFault.target = null;
    fireEvent.click(screen.getByRole("button", { name: "Retry preview" }));
    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.getByTestId("card").textContent).toContain("My draft stays here.");
    expect((screen.getByRole("radio", { name: "Moss" }) as HTMLInputElement).checked).toBe(true);
    expect(caught).toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("local creation recovery", () => {
  it("carries a failed local save to its card and retries only device storage", async () => {
    const original = { id: "original-kept-line", payload };
    window.localStorage.setItem("carried.shelf.v1", JSON.stringify([original]));
    const setItem = Storage.prototype.setItem;
    let quota = true;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, key, value) {
      if (key === "carried.shelf.v1" && quota) throw new DOMException("quota", "QuotaExceededError");
      setItem.call(this, key, value);
    });
    const stop = subscribeShelf(() => { getShelf(); });
    try {
      const composer = wrap(<Composer book={BOOKS[0]} />); await flush();
      fireEvent.change(screen.getByLabelText("01. The line it left in you"), { target: { value: "Created once, saved later." } });
      fireEvent.change(screen.getByLabelText("02. Sign it"), { target: { value: "Mira" } });
      await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Stamp it & pass it on" })); });
      expect(fetch).toHaveBeenCalledTimes(1);
      const destination = push.mock.calls[0][0] as string;
      const id = destination.slice(3);
      expect(decodeLine(id)).toMatchObject({ q: "Created once, saved later.", n: "Mira" });
      expect(getShelf()).toEqual([original]);
      composer.unmount();
      wrap(<StrictMode>{await LinePage({ params: Promise.resolve({ id }) })}</StrictMode>); await flush();
      expect(screen.getByRole("status").textContent).toMatch(/created.*not saved on this device/i);
      expect(screen.getByText(/copy.*link.*download/i)).toBeTruthy();
      fireEvent.click(screen.getByRole("button", { name: "Retry saving on this device" }));
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(screen.getByRole("status").textContent).toMatch(/not saved on this device/i);
      quota = false;
      fireEvent.click(screen.getByRole("button", { name: "Retry saving on this device" }));
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(screen.getByRole("status").textContent).toMatch(/saved on this device/i);
      expect(screen.queryByRole("button", { name: "Retry saving on this device" })).toBeNull();
      expect(getShelf().map((entry) => entry.id)).toEqual([id, "original-kept-line"]);
    } finally { stop(); }
  });
});

describe("resolved restyle", () => {
  it("offers restyling on the resolved card URL instead of an orphaned book route", async () => {
    const orphan = { ...payload, b: "lost-reader-book", bt: "A Book Carried Along", ba: "R. Author", by: 2024 };
    const id = encodePayload(orphan);
    wrap(await LinePage({ params: Promise.resolve({ id }) })); await flush();
    expect(screen.getByRole("link", { name: "Recreate this line in another design" }).getAttribute("href")).toBe(`/l/${id}?restyle=1#write`);
  });

  it("restyles carried book metadata as a new dated link without posting to a missing book", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-10T12:00:00Z"));
    const orphan = { ...payload, b: "orphan-reader-book", bt: "A Book Carried Along", ba: "R. Author", by: 2024, n: "Original Reader", ct: "bookplate-v1" as const };
    const id = encodePayload(orphan);
    const original = { id, payload: orphan };
    window.localStorage.setItem("carried.shelf.v1", JSON.stringify([original]));
    window.history.replaceState(null, "", `/l/${id}?restyle=1#line`);
    wrap(await LinePage({ params: Promise.resolve({ id }), searchParams: Promise.resolve({ restyle: "1" }) })); await flush();
    expect((screen.getByLabelText("01. The line it left in you") as HTMLTextAreaElement).value).toBe("What stayed");
    expect((screen.getByLabelText("02. Sign it") as HTMLInputElement).value).toBe("Original Reader");
    expect(screen.getByText(/link-only/i)).toBeTruthy();
    const shopUrl = new URL(screen.getByRole("link", { name: "Put it on something" }).getAttribute("href")!, window.location.origin);
    const selection = parsePersonalization(Object.fromEntries(shopUrl.searchParams)).selection!;
    expect(selection.sourceId).toBe(id);
    expect(selection.payload.d).toBe("2026-11-09");
    fireEvent.click(screen.getByRole("radio", { name: /Ticket/ }));
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Stamp it & pass it on" })); });
    expect(fetch).not.toHaveBeenCalled();
    const copyId = (push.mock.calls[0][0] as string).slice(3);
    expect(copyId).not.toBe(id);
    expect(decodeLine(copyId)).toMatchObject({ q: "What stayed", n: "Original Reader", d: "2026-11-10", ct: "ticket-v1", bt: "A Book Carried Along", ba: "R. Author", by: 2024 });
    expect(getShelf().find((entry) => entry.id === id)).toEqual(original);
    expect(window.location.pathname).toBe(`/l/${id}`);
  });
});

describe("design selection", () => {
  it("does not replace an intentionally blank restyle signature with the remembered name", async () => {
    window.localStorage.setItem("carried.name.v1", "Device Reader");
    wrap(<Composer book={BOOKS[0]} initialPayload={payload} sourceId="signature-source" />);
    const name = screen.getByLabelText("02. Sign it") as HTMLInputElement;
    fireEvent.change(name, { target: { value: "" } });
    await flush();
    expect(name.value).toBe("");
  });
  it("prefills text, name, ink, and design from a same-book recreation link", async () => {
    window.history.replaceState(null, "", `/b/${BOOKS[0].slug}?line=${encodePayload({ ...payload, ct: "poster-v1" })}&id=kept-line`);
    wrap(<Composer book={BOOKS[0]} />); await flush();
    expect((screen.getByLabelText("01. The line it left in you") as HTMLTextAreaElement).value).toBe("What stayed");
    expect((screen.getByLabelText("02. Sign it") as HTMLInputElement).value).toBe("Reader");
    expect((screen.getByRole("radio", { name: "Paper" }) as HTMLInputElement).checked).toBe(true);
    expect((screen.getByRole("radio", { name: /Poster/ }) as HTMLInputElement).checked).toBe(true);
  });
  it("ignores recreation payloads for another book and unreadable payloads", async () => {
    window.history.replaceState(null, "", `/b/${BOOKS[0].slug}?line=${encodePayload({ ...payload, b: "another-book" })}`);
    wrap(<Composer book={BOOKS[0]} />); await flush();
    expect((screen.getByLabelText("01. The line it left in you") as HTMLTextAreaElement).value).toBe("");
    cleanup();
    window.history.replaceState(null, "", `/b/${BOOKS[0].slug}?line=smudged-beyond-reading`);
    wrap(<Composer book={BOOKS[0]} />); await flush();
    expect((screen.getByLabelText("01. The line it left in you") as HTMLTextAreaElement).value).toBe("");
  });
  it("posts the chosen design and carries it into the offline payload", async () => {
    wrap(<Composer book={BOOKS[0]} />); await flush();
    fireEvent.change(screen.getByLabelText("01. The line it left in you"), { target: { value: "A line to keep." } });
    fireEvent.change(screen.getByLabelText("02. Sign it"), { target: { value: "Mira" } });
    fireEvent.click(screen.getByRole("radio", { name: /Ticket/ }));
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Stamp it & pass it on" })); });
    expect(JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string)).toMatchObject({ q: "A line to keep.", s: "paper", ct: "ticket-v1" });
    const shelf = JSON.parse(window.localStorage.getItem("carried.shelf.v1")!);
    expect(shelf[0].payload).toMatchObject({ q: "A line to keep.", ct: "ticket-v1" });
    expect(push).toHaveBeenCalledWith(`/l/${shelf[0].id}`);
  });
  it("keeps typed text and signature when the design changes from the keyboard", async () => {
    wrap(<Composer book={BOOKS[0]} />); await flush();
    fireEvent.change(screen.getByLabelText("01. The line it left in you"), { target: { value: "A line to keep." } });
    fireEvent.change(screen.getByLabelText("02. Sign it"), { target: { value: "Mira" } });
    const designRadios = screen.getAllByRole("radio").filter((el) => (el as HTMLInputElement).name === "card-design");
    expect(designRadios).toHaveLength(3);
    expect(designRadios.every((el) => el.tagName === "INPUT")).toBe(true);
    act(() => designRadios[1].focus());
    fireEvent.click(designRadios[1]);
    expect((designRadios[1] as HTMLInputElement).checked).toBe(true);
    expect((screen.getByLabelText("01. The line it left in you") as HTMLTextAreaElement).value).toBe("A line to keep.");
    expect((screen.getByLabelText("02. Sign it") as HTMLInputElement).value).toBe("Mira");
  });
  it("changes the shop design while retaining the selection's source id", async () => {
    const selection: Selection = { payload: { ...payload, ct: "bookplate-v1" }, sourceId: "kept-line-id", isExample: false };
    const example: Selection = { payload: { ...payload, q: "An example", ct: "poster-v1" }, sourceId: "example-id", isExample: true };
    const onChange = vi.fn();
    wrap(<LinePicker selection={selection} saved={[]} example={example} onChange={onChange} />); await flush();
    expect((screen.getByRole("radio", { name: "Bookplate" }) as HTMLInputElement).checked).toBe(true);
    fireEvent.click(screen.getByRole("radio", { name: "Poster" }));
    expect(onChange).toHaveBeenCalledTimes(1);
    const next = onChange.mock.calls[0][0] as Selection;
    expect(next.sourceId).toBe("kept-line-id");
    expect(next.payload.ct).toBe("poster-v1");
    expect(next.payload.q).toBe("What stayed");
  });
  it("shows a legacy shop payload without an edition as the house design", async () => {
    const selection: Selection = { payload: { ...payload }, sourceId: "legacy-line", isExample: false };
    const example: Selection = { payload: { ...payload, q: "An example" }, sourceId: "example-id", isExample: true };
    wrap(<LinePicker selection={selection} saved={[]} example={example} onChange={vi.fn()} />); await flush();
    expect((screen.getByRole("radio", { name: "Bookplate" }) as HTMLInputElement).checked).toBe(true);
    expect((screen.getByRole("radio", { name: "Ticket" }) as HTMLInputElement).checked).toBe(false);
  });
});
