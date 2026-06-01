// theme.ts reads localStorage + matchMedia at module init, so we use
// vi.resetModules() to re-execute it under different environments.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const STORAGE_KEY = "doctorina_theme";

interface MatchMediaMock {
  matches: boolean;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
  addListener: ReturnType<typeof vi.fn>;
  removeListener: ReturnType<typeof vi.fn>;
  dispatchEvent: ReturnType<typeof vi.fn>;
  media: string;
  onchange: null;
}

function stubMatchMedia(prefersDark: boolean): MatchMediaMock {
  const mock: MatchMediaMock = {
    matches: prefersDark,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
    media: "(prefers-color-scheme: dark)",
    onchange: null,
  };
  vi.stubGlobal("matchMedia", () => mock);
  // Also patch window.matchMedia which is what the module actually calls.
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: () => mock,
  });
  return mock;
}

beforeEach(() => {
  localStorage.clear();
  vi.resetModules();
  document.documentElement.classList.remove("dark");
  document.documentElement.removeAttribute("data-kb-theme");
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("theme initial state", () => {
  it("defaults to 'system' when nothing stored", async () => {
    stubMatchMedia(false);
    const { theme } = await import("./theme");
    expect(theme()).toBe("system");
  });

  it("uses stored theme when valid", async () => {
    localStorage.setItem(STORAGE_KEY, "dark");
    stubMatchMedia(false);
    const { theme } = await import("./theme");
    expect(theme()).toBe("dark");
  });

  it("ignores invalid stored value and falls back to system", async () => {
    localStorage.setItem(STORAGE_KEY, "garbage");
    stubMatchMedia(false);
    const { theme } = await import("./theme");
    expect(theme()).toBe("system");
  });
});

describe("resolvedTheme", () => {
  it("returns the explicit theme when not 'system'", async () => {
    localStorage.setItem(STORAGE_KEY, "light");
    stubMatchMedia(true); // would resolve to dark if system
    const { resolvedTheme } = await import("./theme");
    expect(resolvedTheme()).toBe("light");
  });

  it("resolves 'system' to dark when prefers-color-scheme: dark", async () => {
    stubMatchMedia(true);
    const { resolvedTheme } = await import("./theme");
    expect(resolvedTheme()).toBe("dark");
  });

  it("resolves 'system' to light when prefers-color-scheme: light", async () => {
    stubMatchMedia(false);
    const { resolvedTheme } = await import("./theme");
    expect(resolvedTheme()).toBe("light");
  });
});

describe("setTheme", () => {
  it("updates the signal", async () => {
    stubMatchMedia(false);
    const { theme, setTheme } = await import("./theme");
    setTheme("dark");
    expect(theme()).toBe("dark");
  });
});

describe("initTheme", () => {
  it("applies the dark class and data-kb-theme attribute", async () => {
    stubMatchMedia(false);
    const { setTheme, initTheme } = await import("./theme");
    const { createRoot } = await import("solid-js");
    createRoot(() => {
      setTheme("dark");
      initTheme();
    });
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.getAttribute("data-kb-theme")).toBe("dark");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("dark");
  });

  it("removes the dark class when switching to light", async () => {
    document.documentElement.classList.add("dark");
    stubMatchMedia(false);
    const { setTheme, initTheme } = await import("./theme");
    const { createRoot } = await import("solid-js");
    createRoot(() => {
      setTheme("light");
      initTheme();
    });
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(document.documentElement.getAttribute("data-kb-theme")).toBe("light");
  });
});
