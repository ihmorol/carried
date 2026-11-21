// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useRef, useState } from "react";
import LineDrawer from "../LineDrawer";
import { LocaleProvider } from "../LocaleProvider";
import { BOOKS } from "@/lib/books";
import type { FeaturedPair } from "@/lib/featured-pair";

vi.mock("next/link", () => ({ default: ({ children, ...props }: React.ComponentProps<"a">) => <a {...props}>{children}</a> }));
vi.mock("../LineCard", () => ({ LineCard: ({ payload }: { payload: { q: string } }) => <article>{payload.q}</article> }));
vi.mock("../ShareRow", () => ({ ShareRow: () => <button>Save the card</button> }));
const pair: FeaturedPair = { book: BOOKS[0], line: { v: 1, id: "one-line", b: BOOKS[0].slug, q: "The road made room.", n: "Reader", d: "2026-11-12", s: "paper" } };

function Fixture() {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  return <LocaleProvider><button ref={trigger} onClick={() => setOpen(true)}>Inspect line</button><LineDrawer pair={pair} open={open} onOpenChange={setOpen} returnFocus={trigger} /></LocaleProvider>;
}

beforeEach(() => { window.localStorage.setItem("carried-locale", "en"); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("line details dialog", () => {
  it("exposes the selected card and real routes inside a labeled modal", async () => {
    render(<Fixture />);
    await act(async () => { await Promise.resolve(); });
    fireEvent.click(screen.getByRole("button", { name: "Inspect line" }));
    const dialog = await screen.findByRole("dialog", { name: "A line to keep" });
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.textContent).toContain(pair.line.q);
    expect(screen.getByRole("link", { name: "Open card page" }).getAttribute("href")).toBe("/l/one-line");
    expect(screen.getByRole("link", { name: "Write your line" }).getAttribute("href")).toBe(`/b/${pair.book.slug}#write`);
    fireEvent.click(screen.getByRole("button", { name: "Close line details" }));
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)); });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Inspect line" }));
  });
});
