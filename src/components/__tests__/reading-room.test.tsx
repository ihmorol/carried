// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ReadingRoom, RoomMotionControl } from "../ReadingRoom";
import { LocaleProvider } from "../LocaleProvider";

let media: MediaQueryList;
let preferenceListeners: Set<() => void>;
let intersection: IntersectionObserverCallback;
const observe = vi.fn();
const disconnect = vi.fn();
const flush = () => act(async () => { await Promise.resolve(); });

beforeEach(() => {
  window.localStorage.clear();
  window.localStorage.setItem("carried-locale", "en");
  preferenceListeners = new Set();
  media = {
    matches: false,
    addEventListener: vi.fn((_name, callback) => preferenceListeners.add(callback)),
    removeEventListener: vi.fn((_name, callback) => preferenceListeners.delete(callback)),
  } as unknown as MediaQueryList;
  vi.stubGlobal("matchMedia", vi.fn(() => media));
  vi.stubGlobal("IntersectionObserver", class {
    constructor(callback: IntersectionObserverCallback) { intersection = callback; }
    observe = observe;
    disconnect = disconnect;
  });
  observe.mockClear();
  disconnect.mockClear();
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

function room() {
  return render(<LocaleProvider><ReadingRoom><RoomMotionControl /><div data-room-scene data-in-view="false">A visible book</div><a href="/books">Find a book</a></ReadingRoom></LocaleProvider>);
}

function setReduced(value: boolean) {
  Object.defineProperty(media, "matches", { value, configurable: true });
  act(() => { preferenceListeners.forEach((listener) => listener()); });
}

describe("reading-room motion", () => {
  it("keeps content present and lets the reader pause and resume", async () => {
    room(); await flush();
    const main = screen.getByRole("main");
    expect(main.id).toBe("main-content");
    expect(main.tabIndex).toBe(-1);
    expect(screen.getByText("A visible book")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Find a book" })).toBeTruthy();
    expect(main.getAttribute("data-motion")).toBe("running");
    fireEvent.click(screen.getByRole("button", { name: "Pause motion" }));
    expect(main.getAttribute("data-motion")).toBe("paused");
    expect(screen.getByRole("button", { name: "Resume motion" }).getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(screen.getByRole("button", { name: "Resume motion" }));
    expect(main.getAttribute("data-motion")).toBe("running");
  });

  it("honors live reduced-motion changes without forgetting an explicit pause", async () => {
    room(); await flush();
    fireEvent.click(screen.getByRole("button", { name: "Pause motion" }));
    setReduced(true);
    expect(screen.getByRole("main").getAttribute("data-motion")).toBe("reduced");
    expect((screen.getByRole("button", { name: "Reduced motion is on" }) as HTMLButtonElement).disabled).toBe(true);
    setReduced(false);
    expect(screen.getByRole("main").getAttribute("data-motion")).toBe("paused");
  });

  it("sleeps offscreen scenes and hidden tabs, then removes observers", async () => {
    const view = room(); await flush();
    const main = screen.getByRole("main");
    const scene = document.querySelector<HTMLElement>("[data-room-scene]")!;
    expect(observe).toHaveBeenCalledWith(scene);
    act(() => intersection([{ target: scene, isIntersecting: true }] as unknown as IntersectionObserverEntry[], {} as IntersectionObserver));
    expect(scene.dataset.inView).toBe("true");
    act(() => intersection([{ target: scene, isIntersecting: false }] as unknown as IntersectionObserverEntry[], {} as IntersectionObserver));
    expect(scene.dataset.inView).toBe("false");
    const hidden = vi.spyOn(document, "hidden", "get").mockReturnValue(true);
    fireEvent(document, new Event("visibilitychange"));
    expect(main.getAttribute("data-page-visible")).toBe("false");
    hidden.mockReturnValue(false);
    fireEvent(document, new Event("visibilitychange"));
    expect(main.getAttribute("data-page-visible")).toBe("true");
    view.unmount();
    expect(disconnect).toHaveBeenCalledOnce();
    expect(preferenceListeners.size).toBe(0);
  });

  it("stays static when media-query support is unavailable", async () => {
    vi.stubGlobal("matchMedia", undefined);
    vi.stubGlobal("IntersectionObserver", undefined);
    room(); await flush();
    expect(screen.getByRole("main").getAttribute("data-motion")).toBe("reduced");
    expect(document.querySelector<HTMLElement>("[data-room-scene]")?.dataset.inView).toBe("true");
    expect(screen.getByRole("link", { name: "Find a book" })).toBeTruthy();
  });

  it("translates the motion control in Bengali", async () => {
    window.localStorage.setItem("carried-locale", "bn");
    room(); await flush();
    fireEvent.click(screen.getByRole("button", { name: "অ্যানিমেশন থামাও" }));
    expect(screen.getByRole("button", { name: "অ্যানিমেশন চালাও" })).toBeTruthy();
  });
});
