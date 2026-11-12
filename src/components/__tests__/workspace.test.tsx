// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { Children, cloneElement, isValidElement, type ReactNode } from "react";
import { Composer } from "../Composer";
import { BOOKS } from "@/lib/books";
import { accessionNo, encodePayload } from "@/lib/line";
import { LineCard } from "../LineCard";
import { Header } from "../Chrome";
import { LocaleProvider } from "../LocaleProvider";
import { ShelfExplorer } from "../ShelfExplorer";
import { RecentFeed } from "../RecentFeed";
import type { SeedLine } from "@/lib/seeds";
import Home from "@/app/page";

const navigation = vi.hoisted(() => ({ pathname: "/", push: vi.fn() }));
vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => ({ push: navigation.push }),
  useSearchParams: () => new URLSearchParams(window.location.search),
  notFound: () => { throw new Error("NEXT_NOT_FOUND"); },
}));
vi.mock("next/link", () => ({
  default: ({ href, onNavigate, children, ...props }: React.ComponentProps<"a"> & { href: string; onNavigate?: () => void }) => (
    <a {...props} href={href} onClick={(event) => { event.preventDefault(); onNavigate?.(); }}>{children}</a>
  ),
}));

vi.mock("@/lib/book-covers", () => ({ resolveCovers: async () => ({}) }));

const wrap = (ui: React.ReactNode) => render(<LocaleProvider>{ui}</LocaleProvider>);
const flush = () => act(async () => { await Promise.resolve(); });

/** jsdom renders client trees, not async RSCs. Resolve only the async server
 * children of Home's returned tree; leave every client component untouched. */
async function resolveServerChildren(node: ReactNode): Promise<ReactNode> {
  if (!isValidElement<{ children?: ReactNode }>(node)) return node;
  if (typeof node.type === "function" && node.type.constructor.name === "AsyncFunction") {
    const ServerChild = node.type as (props: object) => Promise<ReactNode>;
    return resolveServerChildren(await ServerChild(node.props));
  }
  if (node.props.children === undefined) return node;
  const children = await Promise.all(Children.toArray(node.props.children).map(resolveServerChildren));
  return cloneElement(node, {}, ...children);
}

beforeEach(() => {
  navigation.pathname = "/";
  window.localStorage.clear();
  window.localStorage.setItem("carried-locale", "en");
  window.history.replaceState(null, "", "/");
  vi.clearAllMocks();
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ books: [], lines: [], live: false }) }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("reading-room navigation", () => {
  it("expands the labelled desktop navigation and retains all five real destinations", async () => {
    wrap(<Header />); await flush();
    const toggle = screen.getByRole("button", { name: "Expand navigation" });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    const nav = document.getElementById(toggle.getAttribute("aria-controls")!)!;
    expect(within(nav).getAllByRole("link").map((link) => link.getAttribute("href"))).toEqual([
      "/", "/books", "/lines", "/shelf", "/shop",
    ]);
    expect(within(nav).getByRole("link", { name: "Home" }).getAttribute("aria-current")).toBe("page");
    fireEvent.click(toggle);
    expect(screen.getByRole("button", { name: "Collapse navigation" }).getAttribute("aria-expanded")).toBe("true");
    expect(nav.closest("aside")?.getAttribute("data-expanded")).toBe("true");
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
  });

  it("opens the mobile destinations with focus, closes on Escape, and dismisses after navigation", async () => {
    wrap(<><Header /><main id="main-content"><section id="reader-lines" tabIndex={-1}>Reader lines</section></main></>); await flush();
    const toggle = screen.getByRole("button", { name: "Open menu" });
    const nav = document.getElementById(toggle.getAttribute("aria-controls")!)!;
    expect(nav.hidden).toBe(true);
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(document.activeElement).toBe(within(nav).getByRole("link", { name: "Home" }));
    expect(within(nav).getAllByRole("link")).toHaveLength(5);
    fireEvent.keyDown(document.activeElement!, { key: "Escape" });
    expect(nav.hidden).toBe(true);
    expect(document.activeElement).toBe(toggle);
    fireEvent.click(toggle);
    fireEvent.click(within(nav).getByRole("link", { name: "Lines" }));
    expect(nav.hidden).toBe(true);
    expect(document.activeElement).toBe(toggle);
  });

  it("dismisses the mobile menu when focus leaves it or the route changes", async () => {
    const view = wrap(<><Header /><button>Page action</button></>); await flush();
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    const pageAction = screen.getByRole("button", { name: "Page action" });
    act(() => pageAction.focus());
    expect(screen.getByRole("button", { name: "Open menu" }).getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    navigation.pathname = "/shop/cart";
    view.rerender(<LocaleProvider><Header /></LocaleProvider>); await flush();
    expect(screen.getByRole("button", { name: "Open menu" }).getAttribute("aria-expanded")).toBe("false");
    expect(within(document.getElementById("desktop-navigation")!).getByRole("link", { name: "Shop" }).getAttribute("aria-current")).toBe("page");
  });

  it("marks book and line routes as the active destination", async () => {
    navigation.pathname = "/books";
    const view = wrap(<Header />); await flush();
    const nav = document.getElementById("desktop-navigation")!;
    expect(within(nav).getByRole("link", { name: "The shelf" }).getAttribute("aria-current")).toBe("page");
    expect(within(nav).getByRole("link", { name: "Home" }).hasAttribute("aria-current")).toBe(false);
    navigation.pathname = "/b/a-real-book";
    view.rerender(<LocaleProvider><Header /></LocaleProvider>); await flush();
    expect(within(document.getElementById("desktop-navigation")!).getByRole("link", { name: "The shelf" }).getAttribute("aria-current")).toBe("page");
    navigation.pathname = "/l/a-real-line";
    view.rerender(<LocaleProvider><Header /></LocaleProvider>); await flush();
    expect(within(document.getElementById("desktop-navigation")!).getByRole("link", { name: "Lines" }).getAttribute("aria-current")).toBe("page");
    navigation.pathname = "/";
    view.rerender(<LocaleProvider><Header /></LocaleProvider>); await flush();
    expect(within(document.getElementById("desktop-navigation")!).getByRole("link", { name: "Lines" }).hasAttribute("aria-current")).toBe(false);
  });

  it("translates navigation while keeping the language preference on-device", async () => {
    wrap(<Header />); await flush();
    fireEvent.click(screen.getByRole("button", { name: "বাংলা" }));
    expect(screen.getByRole("button", { name: "নেভিগেশন বড় করো" })).toBeTruthy();
    expect(within(document.getElementById("desktop-navigation")!).getByRole("link", { name: "লাইন" }).getAttribute("href")).toBe("/lines");
    expect(window.localStorage.getItem("carried-locale")).toBe("bn");
  });
});

describe("workspace shelf", () => {
  it("pages eight books at a time without losing combined query and genre filters", async () => {
    wrap(<ShelfExplorer variant="workspace" pageSize={8} />); await flush();
    expect(screen.getAllByRole("listitem")).toHaveLength(8);
    fireEvent.click(screen.getByRole("button", { name: "Show 8 more books" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(16);
    fireEvent.click(screen.getByRole("button", { name: "fiction" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(8);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "Orwell" } });
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(new URL(window.location.href).searchParams.get("q")).toBe("Orwell");
    expect(new URL(window.location.href).searchParams.get("genre")).toBe("fiction");
    fireEvent.click(screen.getByRole("button", { name: "poetry" }));
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
    expect((screen.getByRole("searchbox") as HTMLInputElement).value).toBe("Orwell");
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(8);
  });

  it("restores history filters and offers the live add-book form in workspace mode", async () => {
    window.history.replaceState({ preserved: true }, "", "/?q=Orwell&genre=fiction#shelf");
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => ({ books: [], live: true }) } as Response);
    wrap(<ShelfExplorer variant="workspace" pageSize={8} />); await flush();
    expect((screen.getByRole("searchbox") as HTMLInputElement).value).toBe("Orwell");
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "+ Add a book" }));
    expect(screen.getByLabelText("Title")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    window.history.replaceState({ preserved: true }, "", "/?genre=poetry#shelf");
    fireEvent(window, new PopStateEvent("popstate"));
    expect((screen.getByRole("searchbox") as HTMLInputElement).value).toBe("");
    expect(screen.getByRole("button", { name: "poetry" }).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "all" }));
    expect(window.history.state).toEqual({ preserved: true });
    expect(window.location.hash).toBe("#shelf");
    expect(screen.getAllByRole("listitem")).toHaveLength(8);
  });
});

describe("workspace recent lines", () => {
  it("lists actual quotes, names, books, and dates with honest editorial status", async () => {
    const seeds: SeedLine[] = [
      { v: 1, id: "curated-line", b: "the-alchemist", q: "The road made room for my own voice.", n: "Mira", s: "paper", d: "2026-05-03" },
      { v: 1, id: "reader-added-line", b: "a-readers-book", bt: "A Reader’s Book", ba: "A. Writer", by: 2024, q: "I learned to read slowly.", n: "Rafi", s: "paper", d: "2026-05-04" },
    ];
    wrap(<RecentFeed seeds={seeds} variant="list" />); await flush();
    expect(screen.getByRole("heading", { name: "Reader lines" })).toBeTruthy();
    expect(screen.getByRole("status").textContent).toContain("Editorial collection");
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3); // two lines plus the all-lines link row
    expect(within(items[0]).getByText("The road made room for my own voice.")).toBeTruthy();
    expect(within(items[0]).getByText("Mira")).toBeTruthy();
    expect(within(items[0]).getByText("The Alchemist")).toBeTruthy();
    expect(items[0].querySelector("time")?.getAttribute("datetime")).toBe("2026-05-03");
    expect(within(items[0]).getByRole("link").getAttribute("href")).toBe("/l/curated-line");
    expect(within(items[1]).getByText("A Reader’s Book")).toBeTruthy();
    expect(within(items[1]).getByText("Rafi")).toBeTruthy();
    expect(within(items[2]).getByRole("link").getAttribute("href")).toBe("/lines");
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("replaces editorial entries only with a confirmed live response", async () => {
    const seed: SeedLine = { v: 1, id: "editorial", b: "the-alchemist", q: "An editorial reflection.", n: "Mira", s: "paper", d: "2026-05-03" };
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => ({ live: true, lines: [
      { id: "public-line", payload: { ...seed, q: "A public reader’s reflection.", n: "Rafi" }, t: 1, votes: 2 },
    ] }) } as Response);
    wrap(<RecentFeed seeds={[seed]} variant="list" />); await flush();
    expect(screen.queryByText("An editorial reflection.")).toBeNull();
    expect(screen.getByText("A public reader’s reflection.")).toBeTruthy();
    expect(screen.getByRole("status").textContent).toBe("live, just carried");
    expect(screen.getByRole("link", { name: "Read Rafi’s line" }).getAttribute("href")).toBe("/l/public-line");
  });
});

describe("card action counts", () => {
  it("keeps a card's underline summary on the same accepted count as its button", async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => ({ votes: 1, voted: true }) } as Response);
    const onChange = vi.fn();
    wrap(<LineCard payload={{ v: 1, b: BOOKS[0].slug, q: "One reader kept it.", n: "Mira", s: "paper", d: "2026-11-09" }} id="summary-card" votes={0} onChange={onChange} />); await flush();
    expect(screen.getByText("not yet underlined")).toBeTruthy();
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Underline · 0" })); });
    expect(screen.getByRole("button", { name: "Underline · 1" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.queryByText("not yet underlined")).toBeNull();
    expect(screen.getByText("underlined once")).toBeTruthy();
    expect(onChange).toHaveBeenCalledWith("summary-card", 1, true);
  });
});

describe("composer proof recovery", () => {
  it("keeps a valid payload source id longer than 512 characters in legacy prefill", async () => {
    const payload = { v: 1 as const, b: BOOKS[0].slug, q: "ব".repeat(180), n: "Reader", s: "paper" as const, d: "2026-11-09" };
    const id = encodePayload(payload);
    expect(id.length).toBeGreaterThan(512);
    window.history.replaceState(null, "", `/b/${BOOKS[0].slug}?line=${id}&id=${id}`);
    wrap(<Composer book={BOOKS[0]} />); await flush();
    const proof = document.querySelector(".composer-proof");
    expect(proof?.querySelector(".edition-accession")?.textContent).toBe(accessionNo(id));
    expect((screen.getByLabelText("02. Sign it") as HTMLInputElement).value).toBe("Reader");
  });
  it("keeps a long paste editable with immediate validation in the real card and picker", async () => {
    wrap(<Composer book={BOOKS[0]} />); await flush();
    const field = screen.getByLabelText("01. The line it left in you") as HTMLTextAreaElement;
    fireEvent.change(screen.getByLabelText("02. Sign it"), { target: { value: "Mira" } });
    const pasted = "  A paragraph I still need to edit.\n".repeat(200);
    fireEvent.change(field, { target: { value: pasted } });
    expect(field.value).toBe(pasted);
    expect(field.getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByRole("alert").textContent).toMatch(/220/);
    expect(screen.getAllByRole("radio")).toHaveLength(6);
    expect(document.querySelectorAll(".edition-artwork")).toHaveLength(4);
    fireEvent.click(screen.getByRole("button", { name: "Stamp it & pass it on" }));
    expect(fetch).not.toHaveBeenCalled();
    expect(navigation.push).not.toHaveBeenCalled();
    fireEvent.change(field, { target: { value: "The part I want to keep." } });
    expect(field.getAttribute("aria-invalid")).toBe("false");
    expect(screen.queryByRole("alert")).toBeNull();
    expect(document.querySelector(".composer-proof .edition-artwork")?.getAttribute("aria-label")).toContain("The part I want to keep.");
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Stamp it & pass it on" })); });
    const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string);
    expect(body).toMatchObject({ q: "The part I want to keep.", n: "Mira" });
  });

  it("uses normalized JavaScript length without trimming the raw line or signature", async () => {
    wrap(<Composer book={BOOKS[0]} />); await flush();
    const line = screen.getByLabelText("01. The line it left in you") as HTMLTextAreaElement;
    const name = screen.getByLabelText("02. Sign it") as HTMLInputElement;
    const raw = `  ${"ব".repeat(219)}   \n`;
    fireEvent.change(line, { target: { value: raw } });
    fireEvent.change(name, { target: { value: "  Mira    Noor  " } });
    expect(line.value).toBe(raw);
    expect(name.value).toBe("  Mira    Noor  ");
    expect(document.getElementById("line-counter")?.textContent).toBe("219 / 220");
    expect(line.getAttribute("aria-invalid")).toBe("false");
    fireEvent.change(line, { target: { value: "😀".repeat(111) } });
    expect(line.value).toBe("😀".repeat(111));
    expect(document.getElementById("line-counter")?.textContent).toBe("222 / 220");
    expect(line.getAttribute("aria-invalid")).toBe("true");
  });

  it("offers a focusable proof before the final mobile submit without nesting forms", async () => {
    wrap(<Composer book={BOOKS[0]} />); await flush();
    const jump = screen.getByRole("link", { name: "View proof" });
    const proof = document.querySelector(".composer-proof")!;
    expect(jump.getAttribute("href")).toBe(`#${proof.id}`);
    fireEvent.click(jump);
    expect(document.activeElement).toBe(proof);
    const submit = screen.getByRole("button", { name: "Stamp it & pass it on" }) as HTMLButtonElement;
    expect(submit.form).toBe(document.querySelector("form.composer-form"));
    expect(proof.compareDocumentPosition(submit) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

describe("home workspace", () => {
  it("exposes sibling shelf and reader-line sectors, one search, and the daily write action", async () => {
    wrap(await resolveServerChildren(Home())); await flush();
    const main = screen.getByRole("main");
    const shelf = within(main).getByRole("region", { name: "The shelf" });
    const lines = within(main).getByRole("region", { name: "Lines" });
    expect(main.id).toBe("main-content");
    expect(shelf.id).toBe("shelf");
    expect(lines.id).toBe("reader-lines");
    expect(shelf.parentElement).toBe(lines.parentElement);
    expect(within(main).getAllByRole("searchbox")).toHaveLength(1);
    expect(within(main).queryByRole("combobox")).toBeNull();
    expect(within(shelf).getAllByRole("listitem")).toHaveLength(8);
    const jumps = within(main).getByRole("navigation", { name: "Jump to a section" });
    expect(within(jumps).getByRole("link", { name: "Shelf" }).getAttribute("href")).toBe("#shelf");
    expect(within(jumps).getByRole("link", { name: "Lines" }).getAttribute("href")).toBe("#reader-lines");
    expect(within(jumps).getByRole("link", { name: "Write your line" }).getAttribute("href")).toMatch(/^\/b\/[^/]+#write$/);
    expect(within(lines).getByRole("link", { name: "Write your line" }).getAttribute("href")).toMatch(/^\/b\/[^/]+#write$/);
    expect(within(lines).queryByRole("button", { name: /Underline/ })).toBeNull();
    expect(within(lines).getAllByRole("listitem")).toHaveLength(4); // three lines plus the all-lines link row
  });
});
