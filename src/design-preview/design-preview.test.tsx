// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { BookshelfPreview, FrontCover, PREVIEW_BOOKS } from "./BookshelfPreview";
import { EditionCard } from "./CardEditions";
import { SAMPLES } from "./types";

afterEach(cleanup);

describe("isolated design comparison", () => {
  it.each(["bookplate", "poster", "ticket"] as const)("keeps all supplied English and Bangla content in %s", (edition) => {
    const content = SAMPLES.bn.long;
    const { container } = render(<EditionCard edition={edition} content={content} ink="paper" />);
    expect(screen.getByText(content.quote)).toBeTruthy();
    expect(screen.getByText(content.name)).toBeTruthy();
    expect(screen.getByText(content.book)).toBeTruthy();
    expect(container.querySelector(`[data-edition="${edition}"]`)).toBeTruthy();
    expect(container.querySelectorAll("button,a,input")).toHaveLength(0);
  });

  it("filters the local shelf without mutating saved data", () => {
    const pick = vi.fn();
    const { container } = render(<BookshelfPreview onPickBook={pick} />);
    const input = screen.getByRole("searchbox");
    fireEvent.change(input, { target: { value: "1984" } });
    expect(container.querySelectorAll(".bookshelf-book")).toHaveLength(1);
    fireEvent.click(container.querySelector(".bookshelf-book")!);
    expect(pick).toHaveBeenCalledWith("1984");
    expect(container.querySelector(".bookshelf-book")?.getAttribute("aria-pressed")).toBe("true");
  });

  it("shows a labeled authored cover when the image fails", () => {
    render(<FrontCover book={PREVIEW_BOOKS[0]} />);
    fireEvent.error(screen.getByRole("img"));
    expect(screen.getByRole("img").getAttribute("aria-label")).toContain("original preview cover");
    expect(screen.getByText("Preview cover")).toBeTruthy();
  });
});
