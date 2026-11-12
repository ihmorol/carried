// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import Home from "@/app/page";
import ShelfPage from "@/app/shelf/page";
import ShopPage from "@/app/shop/page";
import ProductPage from "@/app/shop/[slug]/page";
import CartPage from "@/app/shop/cart/page";
import { LocaleProvider } from "../LocaleProvider";
import { ShopExplorer } from "../shop/ShopExplorer";
import { CATALOG } from "@/lib/commerce/catalog";
import { parsePersonalization, type Selection } from "@/lib/commerce/personalization";

// Keep the server-resolved cover at its fallback: these tests cover entry points,
// while the async cover itself belongs to Next's server rendering.
vi.mock("react", async (importOriginal) => {
  const react = await importOriginal<typeof import("react")>();
  return { ...react, Suspense: ({ fallback }: { fallback: React.ReactNode }) => fallback };
});
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }), notFound: () => { throw new Error("not found"); } }));
vi.mock("next/link", () => ({ default: ({ children, ...props }: React.ComponentProps<"a">) => <a {...props}>{children}</a> }));
vi.mock("../Chrome", () => ({ Header: () => null, Footer: () => null }));
vi.mock("../FrontCover", () => ({ FrontCover: () => <span /> }));
vi.mock("@/lib/book-covers", () => ({ resolveCovers: async () => ({}) }));
vi.mock("../LineCard", () => ({
  LineCard: ({ payload, id, className }: { payload: Selection["payload"]; id?: string; className?: string }) => (
    <div className={className} data-testid="line-preview" data-source={id}>{payload.q}</div>
  ),
}));
vi.mock("../shop/ProductPreview", () => ({
  ProductPreview: ({ selection }: { selection: Selection }) => (
    <div data-testid="concept-preview" data-source={selection.sourceId} data-ink={selection.payload.s} data-design={selection.payload.ct}>{selection.payload.q}</div>
  ),
}));
vi.mock("@/lib/canvas", () => ({ downloadLineCard: vi.fn() }));

const saved: Selection = {
  payload: { v: 1, b: "the-alchemist", q: "The road made room for my own voice.", n: "Mira", s: "paper", d: "2026-11-09", ct: "bookplate-v1" },
  sourceId: "kept-line-id",
  isExample: false,
};
const example: Selection = { ...saved, payload: { ...saved.payload, q: "An editorial reflection." }, sourceId: "example-line-id", isExample: true };
const wrap = (ui: React.ReactNode) => render(<LocaleProvider>{ui}</LocaleProvider>);
const flush = () => act(async () => { await Promise.resolve(); });

beforeEach(() => {
  window.localStorage.clear();
  window.localStorage.setItem("carried-locale", "en");
  window.history.replaceState(null, "", "/");
  vi.clearAllMocks();
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ books: [], lines: [], covers: {}, live: false }) }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("polished writing and selection entry points", () => {
  it("puts the featured book's primary write action before the eight-book catalogue", async () => {
    wrap(<Home />); await flush();
    const shelf = screen.getByRole("region", { name: "The shelf" });
    const write = within(shelf).getByRole("link", { name: "Write your line" });
    const openBook = within(shelf).getByRole("link", { name: "Open the book" });
    const catalogue = within(shelf).getByRole("list");
    expect(write.classList.contains("ui-button")).toBe(true);
    expect(write.getAttribute("href")).toBe(`${openBook.getAttribute("href")}#write`);
    expect(write.compareDocumentPosition(catalogue) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(catalogue).getAllByRole("listitem")).toHaveLength(8);
    const lines = screen.getByRole("region", { name: "Lines" });
    expect(within(lines).getByRole("link", { name: "Write your line" }).getAttribute("href")).toBe(write.getAttribute("href"));
  });

  it("renders one native selector before the artwork and catalogue without changing source identity", async () => {
    window.localStorage.setItem("carried.shelf.v1", JSON.stringify([{ id: saved.sourceId, payload: saved.payload }]));
    const { container } = wrap(<ShopExplorer initial={parsePersonalization({})} example={example} />); await flush();
    const sidebar = screen.getByRole("complementary", { name: "The line you’re carrying" });
    const catalogue = container.querySelector(".shop-main-column")!;
    expect(sidebar.compareDocumentPosition(catalogue) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const select = screen.getByRole("combobox", { name: "Choose a saved line" }) as HTMLSelectElement;
    expect(screen.getAllByRole("combobox")).toHaveLength(1);
    expect(select.value).toBe(saved.sourceId);
    expect(document.getElementById(select.getAttribute("aria-describedby")!)?.textContent).toContain("on this device");
    const radios = screen.getAllByRole("radio") as HTMLInputElement[];
    expect(radios.filter(input => input.name === "shop-ink")).toHaveLength(3);
    expect(radios.filter(input => input.name === "shop-design")).toHaveLength(3);
    const preview = within(sidebar).getByTestId("line-preview");
    expect(radios.every(input => Boolean(input.compareDocumentPosition(preview) & Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
    expect(within(sidebar).getByText("Your saved line")).toBeTruthy();

    fireEvent.click(screen.getByRole("radio", { name: "Moss" }));
    fireEvent.click(screen.getByRole("radio", { name: "Poster" }));
    for (const productPreview of screen.getAllByTestId("concept-preview")) {
      expect(productPreview.dataset).toMatchObject({ source: saved.sourceId, ink: "moss", design: "poster-v1" });
    }
    const bookmark = CATALOG.find(product => product.slug === "bookmark")!;
    fireEvent.click(screen.getByRole("button", { name: bookmark.name.en }));
    const productLink = screen.getByRole("link", { name: `Explore this format · ${bookmark.name.en}` });
    const query = Object.fromEntries(new URL(productLink.getAttribute("href")!, "https://carried.test").searchParams);
    expect(parsePersonalization(query).selection).toEqual({ ...saved, payload: { ...saved.payload, s: "moss", ct: "poster-v1" } });
    expect(screen.getAllByRole("radio")).toHaveLength(6);

    fireEvent.change(select, { target: { value: "example" } });
    expect(within(sidebar).getByText("Editorial example · not your saved line", { selector: "p" })).toBeTruthy();
    expect(screen.getAllByTestId("concept-preview").every(element => element.dataset.source === example.sourceId)).toBe(true);
  });
});

describe("skip-link destinations", () => {
  it.each([
    ["personal shelf", async () => <ShelfPage />],
    ["shop", () => ShopPage({ searchParams: Promise.resolve({}) })],
    ["product", () => ProductPage({ params: Promise.resolve({ slug: "art-print" }), searchParams: Promise.resolve({}) })],
    ["cart", () => CartPage({ searchParams: Promise.resolve({}) })],
  ] as const)("makes the %s main programmatically focusable", async (_name, page) => {
    wrap(await page()); await flush();
    const main = screen.getByRole("main");
    expect(main.id).toBe("main-content");
    expect(main.tabIndex).toBe(-1);
    act(() => main.focus());
    expect(document.activeElement).toBe(main);
  });
});
