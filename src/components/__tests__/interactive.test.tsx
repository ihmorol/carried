// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { HeroSearch } from "../HeroSearch";
import { Composer } from "../Composer";
import { ShelfExplorer } from "../ShelfExplorer";
import { LinesFeed } from "../LinesFeed";
import { RecentFeed } from "../RecentFeed";
import { ShareRow } from "../ShareRow";
import { UnderlineButton } from "../UnderlineButton";
import { BookCover } from "../BookCover";
import { LocaleProvider, useLocale } from "../LocaleProvider";
import { BookLinks } from "../BookLinks";
import ShelfPage from "@/app/shelf/page";
import { BOOKS } from "@/lib/books";
import { addToShelf, getShelf, subscribeShelf } from "@/lib/shelf";
import { getVoterId } from "@/lib/voter";
import { usePoll } from "@/lib/use-poll";
import { translate } from "@/lib/i18n";

const { push, download } = vi.hoisted(() => ({ push: vi.fn(), download: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("../Chrome", () => ({ Header: () => null, Footer: () => null }));
vi.mock("../BookSpine", () => ({ BookSpine: () => <span data-testid="spine" /> }));
vi.mock("../LineCard", () => ({ LineCard: ({ payload }: { payload: { q: string; bt?: string } }) => <div data-testid="card">{payload.q}<span>{payload.bt}</span></div> }));
vi.mock("@/lib/canvas", () => ({ downloadLineCard: download, lineCardBlob: vi.fn().mockResolvedValue(null) }));
const payload = { v: 1 as const, b: BOOKS[0].slug, q: "What stayed", n: "Reader", s: "paper" as const, d: "2026-11-09" };
const seed = { ...payload, id: "seed-line" };
const wrap = (ui: React.ReactNode) => render(<LocaleProvider>{ui}</LocaleProvider>);
const flush = () => act(async () => { await Promise.resolve(); });

beforeEach(() => {
  window.localStorage.clear();
  window.localStorage.setItem("carried-locale", "en");
  window.history.replaceState(null, "", "/");
  vi.clearAllMocks();
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ books: [], lines: [], live: false }) }));
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

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
    expect(screen.getAllByTestId("spine")).toHaveLength(24);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "Orwell" } });
    fireEvent.click(screen.getByRole("button", { name: "poetry" }));
    expect(screen.queryAllByTestId("spine")).toHaveLength(0);
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
    expect(screen.getAllByTestId("spine")).toHaveLength(48);
    fireEvent.click(screen.getByRole("button", { name: "fiction" }));
    expect(screen.getAllByTestId("spine")).toHaveLength(24);
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
