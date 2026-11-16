// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { TiltCard } from "../TiltCard";

type MediaOptions = { fine?: boolean; reduced?: boolean };

function stubMedia({ fine = true, reduced = false }: MediaOptions = {}) {
  vi.stubGlobal("matchMedia", vi.fn((query: string) => ({
    matches: query.includes("reduced-motion") ? reduced : fine,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })));
}

let intersection: IntersectionObserverCallback | null = null;
const disconnect = vi.fn();

function stubObserver() {
  vi.stubGlobal("IntersectionObserver", class {
    constructor(callback: IntersectionObserverCallback) { intersection = callback; }
    observe = vi.fn();
    disconnect = disconnect;
  });
}

/** The component batches its writes into one animation frame; run it inline. */
function stubFrames() {
  vi.stubGlobal("requestAnimationFrame", vi.fn((cb: FrameRequestCallback) => { cb(performance.now()); return 1; }));
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
}

const fireLand = (isIntersecting: boolean) => act(() => {
  intersection?.([{ isIntersecting, target: document.querySelector(".stage-object") }] as unknown as IntersectionObserverEntry[], {} as IntersectionObserver);
});

beforeEach(() => {
  intersection = null;
  disconnect.mockClear();
  stubMedia();
  stubFrames();
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("card stage", () => {
  it("renders the children on the object with decorative layers aria-hidden", () => {
    const { container } = render(<TiltCard><p>the line stays</p></TiltCard>);
    const stage = container.querySelector(".stage")!;
    const object = stage.querySelector(".stage-object")!;
    expect(object.querySelector(".stage-card")!.textContent).toBe("the line stays");
    expect(stage.querySelector(".stage-stack")!.getAttribute("aria-hidden")).toBe("true");
    expect(stage.querySelector(".stage-shadow")!.getAttribute("aria-hidden")).toBe("true");
  });

  it("leans a fine pointer through stage variables in one batched frame", () => {
    stubMedia({ fine: true, reduced: false });
    const { container } = render(<TiltCard><p>x</p></TiltCard>);
    const stage = container.querySelector(".stage") as HTMLElement;
    const object = container.querySelector(".stage-object") as HTMLElement;
    vi.spyOn(stage, "getBoundingClientRect").mockReturnValue({
      width: 200, height: 250, left: 0, top: 0, right: 200, bottom: 250, x: 0, y: 0, toJSON: () => ({}),
    } as DOMRect);
    fireEvent.pointerMove(stage, { clientX: 150, clientY: 100 });
    expect(object.style.getPropertyValue("--stage-ry")).toBe("1.50deg");
    expect(object.style.getPropertyValue("--stage-rx")).toBe("0.60deg");
    expect(object.style.getPropertyValue("--stage-s")).toBe("1.020");
    expect(object.style.getPropertyValue("--stage-shadow-x")).toBe("2.50px");
  });

  it.each([
    ["coarse pointer", { fine: false }],
    ["reduced motion", { reduced: true }],
  ] as const)("keeps the tilt off for %s", (_name, options) => {
    stubMedia(options);
    const { container } = render(<TiltCard><p>x</p></TiltCard>);
    const stage = container.querySelector(".stage") as HTMLElement;
    const object = container.querySelector(".stage-object") as HTMLElement;
    expect(object.querySelector(".stage-card")!.textContent).toBe("x");
    fireEvent.pointerMove(stage, { clientX: 150, clientY: 100 });
    expect(object.style.getPropertyValue("--stage-rx")).toBe("");
    expect(object.style.getPropertyValue("--stage-ry")).toBe("");
    expect(object.style.getPropertyValue("--stage-s")).toBe("");
  });

  it("stays off without matchMedia and lands visible when IntersectionObserver is missing", () => {
    vi.stubGlobal("matchMedia", undefined);
    const { container } = render(<TiltCard land><p>landed anyway</p></TiltCard>);
    const stage = container.querySelector(".stage") as HTMLElement;
    const object = container.querySelector(".stage-object") as HTMLElement;
    fireEvent.pointerMove(stage, { clientX: 50, clientY: 50 });
    expect(object.style.getPropertyValue("--stage-ry")).toBe("");
    expect(object.dataset.land).toBe("done");
    expect(object.querySelector(".stage-card")!.textContent).toBe("landed anyway");
  });

  it("pends the landing until the stage enters the viewport, then runs it once", () => {
    stubObserver();
    const { container } = render(<TiltCard land><p>hero</p></TiltCard>);
    const object = container.querySelector(".stage-object") as HTMLElement;
    expect(object.dataset.land).toBe("pending");
    fireLand(false);
    expect(object.dataset.land).toBe("pending");
    fireLand(true);
    expect(object.dataset.land).toBe("run");
    expect(disconnect).toHaveBeenCalled();
    // A second intersection report must not re-run the entrance.
    fireLand(true);
    expect(object.dataset.land).toBe("run");
  });

  it("lands immediately at rest inside a paused or reduced room", () => {
    stubObserver();
    const { container } = render(
      <div data-motion="paused"><TiltCard land><p>quiet room</p></TiltCard></div>,
    );
    const object = container.querySelector(".stage-object") as HTMLElement;
    expect(object.dataset.land).toBe("pending");
    fireLand(true);
    expect(object.dataset.land).toBe("done");
    expect(object.querySelector(".stage-card")!.textContent).toBe("quiet room");
  });
});
