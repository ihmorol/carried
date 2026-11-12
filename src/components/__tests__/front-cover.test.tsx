// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { FrontCover } from "../FrontCover";

afterEach(cleanup);

const book = { slug: "the-metamorphosis", title: "The Metamorphosis", author: "Franz Kafka", spine: "charcoal" as const };

describe("front cover tile", () => {
  it("renders a resolved cover image, eager when featured", () => {
    render(<FrontCover {...book} src="/covers/the-metamorphosis.jpg" featured />);
    const img = screen.getByRole("img") as HTMLImageElement;
    expect(img.getAttribute("src")).toBe("/covers/the-metamorphosis.jpg");
    expect(img.getAttribute("alt")).toBe("The Metamorphosis by Franz Kafka, front cover");
    expect(img.getAttribute("loading")).toBe("eager");
    expect(document.querySelector(".front-cover-caption")?.textContent).toBe(""); // caption line stays reserved
  });

  it("loads non-featured covers lazily", () => {
    render(<FrontCover {...book} src="/covers/the-metamorphosis.jpg" />);
    expect((screen.getByRole("img") as HTMLImageElement).getAttribute("loading")).toBe("lazy");
  });

  it("falls back to the authored Carried cover when no image resolves", () => {
    render(<FrontCover {...book} />);
    expect(screen.queryByRole("img", { name: /front cover/ })).toBeNull();
    const authored = screen.getByRole("img", { name: "The Metamorphosis by Franz Kafka, Carried cover" });
    expect(authored.textContent).toContain("The Metamorphosis");
    expect(authored.textContent).toContain("Franz Kafka");
    expect(screen.getByText("Carried cover")).toBeTruthy();
  });

  it("wraps long fallback titles inside the artwork instead of clipping words", () => {
    render(<FrontCover {...book} title="The Alchemist" />);
    const title = screen.getByText("The Alchemist");
    expect(title.style.overflowWrap).toBe("anywhere");
    expect(title.style.fontSize).toBe("clamp(11px, 11cqi, 19px)");
  });

  it("swaps to the authored cover when the image fails, and retries with a new source", () => {
    const view = render(<FrontCover {...book} src="/broken.jpg" />);
    fireEvent.error(screen.getByRole("img"));
    expect(screen.getByRole("img", { name: /Carried cover/ })).toBeTruthy();
    view.rerender(<FrontCover {...book} src="/fixed.jpg" />);
    expect((screen.getByRole("img") as HTMLImageElement).getAttribute("src")).toBe("/fixed.jpg");
  });
});
