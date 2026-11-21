// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Personalizer } from "../shop/Personalizer";
import { CartView } from "../shop/CartView";
import { DownloadCard } from "../shop/DownloadCard";
import { ShopExplorer } from "../shop/ShopExplorer";
import { LocaleProvider } from "../LocaleProvider";
import { useCart } from "@/lib/commerce/hooks";
import { CART_KEY, cartStore, makeCartItem, MAX_CART_ITEMS } from "@/lib/commerce/cart";
import { getProduct } from "@/lib/commerce/catalog";
import { parsePersonalization, type Selection } from "@/lib/commerce/personalization";
import { decodeLine, encodePayload, type LinePayload } from "@/lib/line";

/**
 * Shop wiring the cart store tests cannot see: the personalizer's re-minting
 * and error statuses, the cart view's steppers and corrupt recovery, the
 * free download states, and cross-tab cart sync.
 */

vi.mock("next/link", () => ({ default: ({ children, ...props }: React.ComponentProps<"a">) => <a {...props}>{children}</a> }));
vi.mock("../LineCard", () => ({
  LineCard: ({ payload, id, className }: { payload: { q: string }; id?: string; className?: string }) => (
    <div className={className} data-testid="line-preview" data-source={id}>{payload.q}</div>
  ),
}));
vi.mock("../shop/ProductPreview", () => ({
  ProductPreview: ({ product, selection, variant }: { product: string; selection: Selection; variant?: string }) => (
    <div data-testid="concept-preview" data-source={selection.sourceId} data-product={product} data-variant={variant}>{selection.payload.q}</div>
  ),
}));
vi.mock("@/lib/canvas", () => ({ exportLineCard: vi.fn() }));
import { exportLineCard } from "@/lib/canvas";

const payload: LinePayload = { v: 1, b: "the-alchemist", q: "The treasure was the shelf.", n: "Mira", s: "paper", d: "2026-11-21" };
const encoded = encodePayload(payload);
const selection: Selection = { payload, sourceId: encoded, isExample: false };
const example: Selection = { payload: { ...payload, q: "An editorial reflection." }, sourceId: "example-line-id", isExample: true };
const product = getProduct("quote-card")!;
const input = { ...selection, productSlug: "quote-card" as const, variant: "center", qty: 2 };

function CartProbe() { const { items, ready } = useCart(); return <div>{ready ? items.length : "loading"}</div>; }

const wrap = (ui: React.ReactNode) => render(<LocaleProvider>{ui}</LocaleProvider>);
const flush = () => act(async () => { await Promise.resolve(); });

beforeEach(() => {
  window.localStorage.clear();
  window.localStorage.setItem("carried-locale", "en");
  vi.clearAllMocks();
  Object.defineProperty(window.URL, "createObjectURL", { configurable: true, value: vi.fn(() => "blob:mock") });
  Object.defineProperty(window.URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("shop personalizer", () => {
  it("re-mints the accession when the words change but keeps it when ink or design change", async () => {
    wrap(<Personalizer product={product} initial={parsePersonalization({ line: encoded })} example={example} />); await flush();
    expect(screen.getAllByTestId("concept-preview")[0].getAttribute("data-source")).toBe(encoded);
    fireEvent.change(screen.getByLabelText("Your line"), { target: { value: "Rewritten before printing." } });
    const reminted = screen.getAllByTestId("concept-preview")[0].getAttribute("data-source")!;
    expect(reminted).not.toBe(encoded);
    expect(decodeLine(reminted)).toMatchObject({ q: "Rewritten before printing.", n: "Mira" });
    fireEvent.click(screen.getByRole("radio", { name: "Moss" }));
    expect(screen.getAllByTestId("concept-preview")[0].getAttribute("data-source")).toBe(reminted);
  });
  it("saves the selection to the device cart and reports that nothing was ordered", async () => {
    wrap(<Personalizer product={product} initial={parsePersonalization({ line: encoded })} example={example} />); await flush();
    fireEvent.click(screen.getByRole("button", { name: "Save to cart" }));
    expect(screen.getByText(/Selection saved to your cart/)).toBeTruthy();
    const stored = JSON.parse(window.localStorage.getItem(CART_KEY)!);
    expect(stored.items).toHaveLength(1);
    expect(stored.items[0]).toMatchObject({ productSlug: "quote-card", variant: "center", qty: 1, payload: { q: payload.q } });
  });
  it("blocks saving a broken link until the reader rewrites the words", async () => {
    const broken = parsePersonalization({ line: "not-base64!!" });
    expect(broken.issue).toBe("invalid-line");
    wrap(<Personalizer product={product} initial={broken} example={example} />); await flush();
    expect(screen.getAllByRole("alert").some((a) => /unreadable or too long/.test(a.textContent ?? ""))).toBe(true);
    const save = screen.getByRole("button", { name: "Save to cart" });
    expect((save as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(save);
    expect(window.localStorage.getItem(CART_KEY)).toBeNull();
    // Editing re-mints a valid payload and lifts the broken-link guard.
    fireEvent.change(screen.getByLabelText("Your line"), { target: { value: "Rewritten after a bad link." } });
    const retry = screen.getByRole("button", { name: "Save to cart" });
    expect((retry as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(retry);
    expect(screen.getByText(/Selection saved to your cart/)).toBeTruthy();
  });
  it("answers an out-of-bounds quantity with the bounded message and writes nothing", async () => {
    const { container } = wrap(<Personalizer product={product} initial={parsePersonalization({ line: encoded })} example={example} />); await flush();
    const qtyField = container.querySelector<HTMLInputElement>(".shop-quantity-field input")!;
    expect(qtyField).toBeTruthy();
    fireEvent.change(qtyField, { target: { value: "0" } });
    // jsdom blocks the implicit button submission on the now-invalid min=1
    // field; the noValidate form in a browser still reaches the handler.
    fireEvent.submit(container.querySelector("form.shop-personalizer-form")!);
    expect(screen.getByRole("alert").textContent).toMatch(/between 1 and 10/);
    expect(window.localStorage.getItem(CART_KEY)).toBeNull();
  });
  it("reports a full cart without dropping the thirty selections already saved", async () => {
    for (let i = 0; i < MAX_CART_ITEMS; i++) {
      cartStore.save({ ...input, payload: { ...payload, q: `Line ${i}` } });
    }
    wrap(<Personalizer product={product} initial={parsePersonalization({ line: encoded })} example={example} />); await flush();
    fireEvent.click(screen.getByRole("button", { name: "Save to cart" }));
    expect(screen.getByRole("alert").textContent).toMatch(/at most 30/);
    expect(JSON.parse(window.localStorage.getItem(CART_KEY)!).items).toHaveLength(MAX_CART_ITEMS);
  });
});

describe("device cart view", () => {
  it("bounds the stepper at 1 and 10, round-trips the edit link, and removes the row", async () => {
    cartStore.save(input);
    wrap(<CartView selection={null} />); await flush();
    expect(screen.getByLabelText("Quantity").textContent).toBe("2");
    fireEvent.click(screen.getByRole("button", { name: "Increase quantity" }));
    expect(screen.getByLabelText("Quantity").textContent).toBe("3");
    const edit = screen.getByRole("link", { name: /Edit personalization/ });
    const query = Object.fromEntries(new URL(edit.getAttribute("href")!, "https://carried.test").searchParams);
    expect(query.edit).toHaveLength(32);
    expect(query.qty).toBe("3");
    const parsed = parsePersonalization(query);
    expect(parsed.selection).toEqual(selection);
    expect(parsed.editKey).toBe(query.edit);
    for (let i = 0; i < 2; i++) fireEvent.click(screen.getByRole("button", { name: "Decrease quantity" }));
    expect((screen.getByRole("button", { name: "Decrease quantity" }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByLabelText("Quantity").textContent).toBe("1");
    fireEvent.click(screen.getByRole("button", { name: "Remove selection" }));
    expect(screen.getByText(/place for what you/)).toBeTruthy();
    expect(screen.getByText(/Selection removed from your cart/)).toBeTruthy();
    expect(JSON.parse(window.localStorage.getItem(CART_KEY)!).items).toHaveLength(0);
  });
  it("offers a clean restart when the stored cart cannot be read", async () => {
    window.localStorage.setItem(CART_KEY, "{broken");
    wrap(<CartView selection={null} />); await flush();
    expect(screen.getByRole("alert").textContent).toMatch(/has been reset/);
    expect(screen.getByText(/place for what you/)).toBeTruthy();
  });
});

describe("free digital download", () => {
  it("confirms a finished download and reports a failed export without throwing", async () => {
    vi.mocked(exportLineCard).mockResolvedValueOnce(new Blob(["png"], { type: "image/png" }));
    wrap(<DownloadCard selection={selection} />); await flush();
    fireEvent.click(screen.getByRole("button", { name: "Download digital card" }));
    expect(screen.getByRole("button", { name: /Preparing your PNG/ })).toBeTruthy();
    expect(await screen.findByText(/Your digital card is ready/)).toBeTruthy();
    cleanup();
    vi.mocked(exportLineCard).mockRejectedValueOnce(new Error("render failed"));
    wrap(<DownloadCard selection={selection} />); await flush();
    fireEvent.click(screen.getByRole("button", { name: "Download digital card" }));
    expect((await screen.findByRole("alert")).textContent).toMatch(/could not be downloaded/);
  });
});

describe("shop entry points", () => {
  it("carries the reader's current selection into the featured concept link", async () => {
    wrap(<ShopExplorer initial={parsePersonalization({})} example={example} />); await flush();
    const featured = screen.getByRole("link", { name: "Personalize the gift set" });
    expect(featured.getAttribute("href")).toMatch(/^\/shop\//);
    const query = Object.fromEntries(new URL(featured.getAttribute("href")!, "https://carried.test").searchParams);
    expect(parsePersonalization(query).selection?.payload).toEqual(example.payload);
  });
  it("syncs the cart across tabs through the storage event", async () => {
    wrap(<CartProbe />); await flush();
    expect(screen.getByText("0")).toBeTruthy();
    const item = makeCartItem(input);
    window.localStorage.setItem(CART_KEY, JSON.stringify({ version: 1, items: [item] }));
    await act(async () => { window.dispatchEvent(new StorageEvent("storage", { key: CART_KEY })); }); await flush();
    expect(screen.getByText("1")).toBeTruthy();
  });
});
