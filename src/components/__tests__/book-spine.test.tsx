// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { BOOKS, originalName, spineHeight, type Book } from "@/lib/books";
import { leanFor, ryFor } from "@/lib/tilt";
import { BookSpine } from "../BookSpine";
import { LocaleProvider } from "../LocaleProvider";
import { ShelfExplorer } from "../ShelfExplorer";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const wrap = (ui: React.ReactNode) => render(<LocaleProvider>{ui}</LocaleProvider>);
const flush = () => act(async () => { await Promise.resolve(); });
const yearFor = (book: Book) => book.year < 0 ? `${Math.abs(book.year)} BC` : String(book.year);
const nameFor = (book: Book) => `${originalName(book)} — ${book.authorBn ?? book.author}, ${yearFor(book)}`;

beforeEach(() => {
  window.localStorage.clear();
  window.localStorage.setItem("carried-locale", "en");
  window.history.replaceState(null, "", "/books");
  vi.clearAllMocks();
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ books: [], live: false }) }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("shelf spine artwork", () => {
  it("leaves compact search and existing detail dimensions unchanged", () => {
    const view = render(<BookSpine book={BOOKS[0]} height={210} />);
    const detail = view.container.firstElementChild as HTMLElement;
    expect(detail.style.height).toBe("210px");
    expect(detail.style.width).toBe("96px");
    expect(detail.classList.contains("spine-3d")).toBe(true);
    expect(detail.getAttribute("aria-hidden")).toBe("true");
    view.rerender(<BookSpine book={BOOKS[0]} height={48} compact />);
    const compact = view.container.firstElementChild as HTMLElement;
    expect(compact.style.height).toBe("48px");
    expect(compact.style.width).toBe("26px");
    expect(compact.classList.contains("book-spine--shelf")).toBe(false);
  });

  it("uses separate cloth, page, and back planes with stable, bounded height and pose", () => {
    const { container } = render(<>{BOOKS.map((book) => <BookSpine key={book.slug} book={book} variant="shelf" />)}</>);
    const spines = Array.from(container.querySelectorAll<HTMLElement>(".book-spine--shelf"));
    expect(spines).toHaveLength(BOOKS.length);
    const heights = spines.map((spine, index) => {
      const book = BOOKS[index];
      expect(spine.getAttribute("aria-hidden")).toBe("true");
      expect(spine.querySelector(".book-spine-face")).not.toBeNull();
      expect(spine.querySelector(".book-spine-pages")).not.toBeNull();
      expect(spine.querySelector(".book-spine-back")).not.toBeNull();
      expect(spine.querySelector(".book-spine-top")).not.toBeNull();
      expect(spine.querySelector("a, button, input, img")).toBeNull();
      expect(spine.style.getPropertyValue("--ry")).toBe(`${ryFor(book.slug)}deg`);
      expect(spine.style.getPropertyValue("--lean")).toBe(`${leanFor(book.slug)}deg`);
      const height = Number.parseFloat(spine.style.getPropertyValue("--spine-height"));
      expect(height).toBe(spineHeight(book, originalName(book).length > 50 ? 316 : 238, 332));
      return height;
    });
    expect(Math.min(...heights)).toBeGreaterThanOrEqual(238);
    expect(Math.max(...heights)).toBeLessThanOrEqual(332);
    expect(new Set(heights).size).toBeGreaterThan(10);
  });

  it.each([
    { ...BOOKS[0], title: "W".repeat(90), titleBn: undefined, language: "en" },
    { ...BOOKS[0], titleBn: "পথের শেষেও একটি দীর্ঘ গল্প পাঠকের মনে থেকে যায় ".repeat(2).slice(0, 90), language: "bn" },
  ])("retains every character of a long $language title at a readable type floor", (book) => {
    const { container } = render(<BookSpine book={book} variant="shelf" />);
    const spine = container.querySelector<HTMLElement>(".book-spine--shelf")!;
    const title = spine.querySelector(".book-spine-title")!;
    expect(title.textContent).toBe(originalName(book));
    expect(title.getAttribute("lang")).toBe(book.language);
    expect(Number.parseFloat(spine.style.getPropertyValue("--spine-title-size"))).toBeGreaterThanOrEqual(14);
    expect(Number.parseFloat(spine.style.getPropertyValue("--spine-height"))).toBeGreaterThanOrEqual(300);
    expect(spine.classList.contains("overflow-hidden")).toBe(false);
  });
});

describe("shelf layout contracts", () => {
  it("keeps dense tracks, a shared baseline, wrapping titles, and gated interaction motion", () => {
    // Source contracts supplement behavior tests; only a browser can prove fit.
    const css = readFileSync(resolve(process.cwd(), "src/app/bookshelf.css"), "utf8");
    expect(css).toMatch(/\.shelf-explorer \.shelf-book-grid\.shelf-spine-grid\s*\{[^}]*grid-template-columns:\s*repeat\(auto-fill, minmax\(min\(100%, 96px\), 1fr\)\)/);
    expect(css).toMatch(/\.shelf-spine-art\s*\{[^}]*align-items:\s*flex-end;[^}]*height:\s*324px;/);
    expect(css).toMatch(/\.shelf-explorer \.shelf-spine-grid > li\s*\{[^}]*animation:\s*none;/);
    expect(css).toMatch(/\.book-spine-title\s*\{[^}]*writing-mode:\s*vertical-rl;[^}]*overflow-wrap:\s*anywhere;/);
    expect(css).toContain("@media (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    expect(css).toContain('[data-motion="paused"]');
    expect(css).not.toMatch(/gradient\(|backdrop-filter|text-overflow:\s*ellipsis|line-clamp|overflow:\s*hidden/);
  });
});

describe("dense shelf discovery", () => {
  it("starts at 32 fully named spine links, shows author and year, and never fetches shelf covers", async () => {
    wrap(<ShelfExplorer />); await flush();
    expect(screen.getByRole("searchbox", { name: "Search the shelf" })).toBeTruthy();
    expect(screen.getAllByRole("listitem")).toHaveLength(32);
    const first = screen.getByRole("link", { name: nameFor(BOOKS[0]) });
    expect(first.getAttribute("href")).toBe(`/b/${BOOKS[0].slug}`);
    expect(within(first).getByText(BOOKS[0].author)).toBeTruthy();
    expect(within(first).getByText(yearFor(BOOKS[0]))).toBeTruthy();
    expect(first.querySelector(".book-spine--shelf")?.getAttribute("aria-hidden")).toBe("true");
    expect(document.querySelector(".front-cover, img")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Show 24 more books" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(48);
    await flush();
    expect(vi.mocked(fetch).mock.calls.length).toBeGreaterThan(0);
    expect(vi.mocked(fetch).mock.calls.every(([url]) => url === "/api/books")).toBe(true);
  });

  it("shows native Bengali authors and BC publication years without truncating metadata", async () => {
    const native = BOOKS.find((book) => book.slug === "pather-panchali")!;
    const readerBook: Book = { ...native, slug: "a-long-reader-book", titleBn: "পথের শেষেও গল্প বেঁচে থাকে", authorBn: "বিভূতিভূষণ বন্দ্যোপাধ্যায় ও রবীন্দ্রনাথ ঠাকুর", tags: ["reader-added"] };
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => ({ books: [readerBook], live: true }) } as Response);
    wrap(<ShelfExplorer />); await flush();
    fireEvent.click(screen.getByRole("button", { name: "by readers" }));
    const nativeLink = screen.getByRole("link", { name: nameFor(readerBook) });
    expect(nativeLink.querySelector(".shelf-spine-author")?.textContent).toBe(readerBook.authorBn);
    expect(nativeLink.querySelector(".shelf-spine-author")?.getAttribute("lang")).toBe("bn");
    fireEvent.click(screen.getByRole("button", { name: "all" }));
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "The Odyssey" } });
    const ancient = BOOKS.find((book) => book.slug === "the-odyssey")!;
    expect(within(screen.getByRole("link", { name: nameFor(ancient) })).getByText("700 BC")).toBeTruthy();
  });

  it("omits only the field in header mode, retaining add-book, filters, and supplied children", async () => {
    wrap(<ShelfExplorer variant="workspace" pageSize={20} searchPlacement="header"><p>Featured shelf content</p></ShelfExplorer>);
    await flush();
    expect(screen.queryByRole("searchbox")).toBeNull();
    expect(screen.getByRole("button", { name: "+ Add a book" })).toBeTruthy();
    expect(screen.getByRole("group", { name: "Filter by kind" })).toBeTruthy();
    expect(screen.getByText("Featured shelf content")).toBeTruthy();
    expect(screen.getAllByRole("listitem")).toHaveLength(20);
  });

  it("restores combined URL filters and notifies header search without losing history state or the anchor", async () => {
    const state = { __NA: true, preserved: "router-state" };
    window.history.replaceState(state, "", "/books?q=Orwell&genre=fiction&keep=yes#shelf");
    wrap(<ShelfExplorer pageSize={4} />); await flush();
    expect((screen.getByRole("searchbox") as HTMLInputElement).value).toBe("Orwell");
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    const observed: string[] = [];
    const onSearch = () => observed.push(new URL(window.location.href).searchParams.get("genre") ?? "all");
    window.addEventListener("carried:search", onSearch);
    try {
      fireEvent.click(screen.getByRole("button", { name: "poetry" }));
      expect(observed).toEqual(["poetry"]);
      expect(screen.queryAllByRole("listitem")).toHaveLength(0);
      expect(window.history.state).toEqual(state);
      expect(window.location.hash).toBe("#shelf");
      expect(new URL(window.location.href).searchParams.get("keep")).toBe("yes");
      fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
      expect(observed).toEqual(["poetry", "all"]);
      expect(screen.getAllByRole("listitem")).toHaveLength(4);
    } finally { window.removeEventListener("carried:search", onSearch); }
  });

  it("preserves show-more on same-filter events and local clicks, but resets changed header and history filters", async () => {
    window.history.replaceState(null, "", "/books?genre=fiction#shelf");
    wrap(<ShelfExplorer pageSize={4} searchPlacement="header" />); await flush();
    fireEvent.click(screen.getByRole("button", { name: "Show 4 more books" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(8);
    fireEvent(window, new Event("carried:search"));
    expect(screen.getAllByRole("listitem")).toHaveLength(8);
    fireEvent.click(screen.getByRole("button", { name: "fiction" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(8);
    window.history.replaceState(null, "", "/books?q=Orwell&genre=fiction#shelf");
    fireEvent(window, new Event("carried:search"));
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    window.history.replaceState(null, "", "/books?genre=fiction#shelf");
    fireEvent(window, new PopStateEvent("popstate"));
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
    fireEvent.click(screen.getByRole("button", { name: "Show 4 more books" }));
    window.history.replaceState(null, "", "/books?genre=fiction#other-anchor");
    fireEvent(window, new PopStateEvent("popstate"));
    expect(screen.getAllByRole("listitem")).toHaveLength(8);
    window.history.replaceState(null, "", "/books?genre=not-a-kind#shelf");
    fireEvent(window, new PopStateEvent("popstate"));
    expect(screen.getByRole("button", { name: "all" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
  });

  it("adopts a changed page size without dropping active filters", async () => {
    window.history.replaceState(null, "", "/books?genre=fiction");
    const view = wrap(<ShelfExplorer pageSize={4} />); await flush();
    fireEvent.click(screen.getByRole("button", { name: "Show 4 more books" }));
    view.rerender(<LocaleProvider><ShelfExplorer pageSize={6} /></LocaleProvider>); await flush();
    expect(screen.getAllByRole("listitem")).toHaveLength(6);
    expect(screen.getByRole("button", { name: "fiction" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("retains the live add-book form and submission destination in header mode", async () => {
    const book: Book = { ...BOOKS[0], slug: "reader-example", title: "Reader Example", author: "A Reader", year: 2025, tags: ["reader-added"] };
    vi.mocked(fetch).mockImplementation(async (_url, init) => ({ ok: true, json: async () => init?.method === "POST" ? { book } : { books: [], live: true } } as Response));
    wrap(<ShelfExplorer searchPlacement="header" />); await flush();
    fireEvent.click(screen.getByRole("button", { name: "+ Add a book" }));
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: book.title } });
    fireEvent.change(screen.getByLabelText("Author"), { target: { value: book.author } });
    fireEvent.change(screen.getByLabelText("Year"), { target: { value: String(book.year) } });
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Shelve it" })); });
    const post = vi.mocked(fetch).mock.calls.find(([, init]) => init?.method === "POST")!;
    expect(JSON.parse(post[1]!.body as string)).toEqual({ title: book.title, author: book.author, year: book.year });
    expect(push).toHaveBeenCalledWith(`/b/${book.slug}#write`);
  });

  it("keeps recoverable add-book errors and the offline explanation", async () => {
    vi.mocked(fetch).mockImplementation(async (_url, init) => ({ ok: init?.method !== "POST", status: init?.method === "POST" ? 429 : 200, json: async () => init?.method === "POST" ? { error: "limited" } : { books: [], live: true } } as Response));
    const view = wrap(<ShelfExplorer searchPlacement="header" />); await flush();
    fireEvent.click(screen.getByRole("button", { name: "+ Add a book" }));
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "A book" } });
    fireEvent.change(screen.getByLabelText("Author"), { target: { value: "A writer" } });
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Shelve it" })); });
    expect(screen.getByRole("alert").textContent).toBeTruthy();
    expect((screen.getByLabelText("Title") as HTMLInputElement).value).toBe("A book");
    expect(push).not.toHaveBeenCalled();
    view.unmount();
    vi.mocked(fetch).mockRejectedValue(new Error("offline"));
    wrap(<ShelfExplorer searchPlacement="header" />); await flush();
    fireEvent.click(screen.getByRole("button", { name: "+ Add a book" }));
    expect(screen.queryByLabelText("Title")).toBeNull();
    expect(screen.getByRole("status").textContent).toContain("could not be reached");
    expect(screen.getAllByRole("listitem")).toHaveLength(32);
  });
});
