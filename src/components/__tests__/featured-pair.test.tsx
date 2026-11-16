// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { FeaturedPairCarousel } from "../FeaturedPairCarousel";
import { HeaderSearch } from "../HeaderSearch";
import { ReadingRoom } from "../ReadingRoom";
import { LocaleProvider } from "../LocaleProvider";
import { BOOKS } from "@/lib/books";
import type { FeaturedPair } from "@/lib/featured-pair";
import type { ComponentProps, ReactNode } from "react";

const { push, media } = vi.hoisted(() => ({ push: vi.fn(), media: { reduced: false } }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("next/link", () => ({ default: ({ children, ...props }: ComponentProps<"a">) => <a {...props}>{children}</a> }));
vi.mock("next/dynamic", () => ({ default: () => function Drawer({ open, pair, onOpenChange }: { open: boolean; pair: FeaturedPair; onOpenChange: (open: boolean) => void }) {
  return open ? <div role="dialog" aria-label="Line details">{pair.line.q}<button onClick={() => onOpenChange(false)}>Close details</button></div> : null;
} }));
vi.mock("motion/react", () => ({
  AnimatePresence: ({ children }: { children: ReactNode }) => children,
  motion: { div: (props: ComponentProps<"div"> & Record<string, unknown>) => <div {...Object.fromEntries(Object.entries(props).filter(([key]) => !["initial", "animate", "exit", "transition", "custom"].includes(key)))} /> },
}));
vi.mock("../FrontCover", () => ({ FrontCover: ({ title }: { title: string }) => <span>{title} cover</span> }));
vi.mock("../LineCard", () => ({ LineCard: ({ payload, id }: { payload: { q: string }; id: string }) => <article data-testid="paired-card" data-id={id}>{payload.q}</article> }));

const pairs: FeaturedPair[] = [
  { book: BOOKS[0], line: { v: 1, id: "first-line", b: BOOKS[0].slug, q: "The road taught me to listen.", n: "Mira", s: "paper", d: "2026-11-12" } },
  { book: BOOKS[1], line: { v: 1, id: "second-line", b: BOOKS[1].slug, q: "A small planet has room for care.", n: "Noor", s: "moss", d: "2026-11-12" } },
];
const flush = () => act(async () => { await Promise.resolve(); });
function mount(items = pairs) { return render(<LocaleProvider><ReadingRoom><FeaturedPairCarousel pairs={items} /></ReadingRoom></LocaleProvider>); }

beforeEach(() => {
  window.localStorage.clear();
  window.localStorage.setItem("carried-locale", "en");
  window.history.replaceState({ kept: true }, "", "/");
  media.reduced = false;
  push.mockClear();
  vi.stubGlobal("matchMedia", vi.fn((query: string) => ({ matches: query.includes("reduced-motion") ? media.reduced : true, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("paired book discovery", () => {
  it("changes the book, line, links and picker together", async () => {
    mount(); await flush();
    expect(screen.getByTestId("paired-card").getAttribute("data-id")).toBe("first-line");
    fireEvent.click(screen.getByRole("button", { name: "Next book" }));
    expect(screen.getByTestId("paired-card").getAttribute("data-id")).toBe("second-line");
    expect(screen.getByRole("heading", { name: BOOKS[1].title })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Write your line" }).getAttribute("href")).toBe(`/b/${BOOKS[1].slug}#write`);
    expect(screen.getByRole("button", { name: BOOKS[1].title }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("main").getAttribute("data-motion")).toBe("paused");
    fireEvent.click(screen.getByRole("button", { name: "Previous book" }));
    expect(screen.getByTestId("paired-card").getAttribute("data-id")).toBe("first-line");
  });

  it("opens the selected identity and keeps real modified-click navigation", async () => {
    mount(); await flush();
    const link = screen.getByRole("link", { name: "View Mira’s card" });
    fireEvent.click(link, { ctrlKey: true });
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(link);
    expect(screen.getByRole("dialog").textContent).toContain(pairs[0].line.q);
    expect(screen.getByRole("main").getAttribute("data-motion")).toBe("paused");
    fireEvent.click(screen.getByRole("button", { name: "Close details" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByTestId("paired-card").getAttribute("data-id")).toBe("first-line");
  });

  it("rotates when idle but stops after keyboard focus", async () => {
    vi.useFakeTimers();
    mount(); await flush();
    act(() => { vi.advanceTimersByTime(9000); });
    expect(screen.getByTestId("paired-card").getAttribute("data-id")).toBe("second-line");
    fireEvent.focus(screen.getByRole("button", { name: "Next book" }));
    act(() => { vi.advanceTimersByTime(18000); });
    expect(screen.getByTestId("paired-card").getAttribute("data-id")).toBe("second-line");
    expect(screen.getByRole("main").getAttribute("data-motion")).toBe("paused");
  });

  it("does not auto-rotate in reduced motion and handles one or no pair", async () => {
    vi.useFakeTimers(); media.reduced = true;
    const view = mount(); await flush();
    act(() => { vi.advanceTimersByTime(18000); });
    expect(screen.getByTestId("paired-card").getAttribute("data-id")).toBe("first-line");
    view.unmount();
    const one = mount(pairs.slice(0, 1)); await flush();
    expect((screen.getByRole("button", { name: "Next book" }) as HTMLButtonElement).disabled).toBe(true);
    one.unmount();
    mount([]); await flush();
    expect(screen.queryByTestId("paired-card")).toBeNull();
  });
});

describe("header catalog search", () => {
  it("shares query/history with the shelf while keeping other state", async () => {
    render(<LocaleProvider><HeaderSearch catalog /></LocaleProvider>); await flush();
    const events = vi.fn(); window.addEventListener("carried:search", events);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "Orwell" } });
    expect(new URL(location.href).searchParams.get("q")).toBe("Orwell");
    expect(window.history.state).toEqual({ kept: true });
    expect(events).toHaveBeenCalledOnce();
    window.history.replaceState({ kept: true }, "", "/?q=Tagore&genre=poetry#shelf");
    fireEvent(window, new Event("carried:search"));
    expect((screen.getByRole("searchbox") as HTMLInputElement).value).toBe("Tagore");
    window.removeEventListener("carried:search", events);
  });

  it("navigates non-catalog pages to the shelf without altering their URL", async () => {
    window.history.replaceState(null, "", "/lines");
    render(<LocaleProvider><HeaderSearch catalog={false} /></LocaleProvider>); await flush();
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "Dune" } });
    expect(location.pathname).toBe("/lines");
    fireEvent.submit(screen.getByRole("search"));
    expect(push).toHaveBeenCalledWith("/books?q=Dune#shelf");
  });
});
