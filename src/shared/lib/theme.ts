import { createEffect, createSignal } from "solid-js";

export type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "doctorina_theme";

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getStoredTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") return stored;
  return "system";
}

function applyTheme(resolved: ResolvedTheme) {
  // `.dark` class drives Tailwind v4 `@custom-variant dark` in src/index.css.
  // `data-kb-theme` is set for compatibility with Kobalte's theme primitive
  // (harmless if unused).
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.setAttribute("data-kb-theme", resolved);
}

const [theme, setThemeSignal] = createSignal<Theme>(getStoredTheme());

function resolveTheme(t: Theme): ResolvedTheme {
  return t === "system" ? getSystemTheme() : t;
}

export const resolvedTheme = () => resolveTheme(theme());
export { theme };

export function setTheme(t: Theme) {
  setThemeSignal(t);
}

export function initTheme() {
  createEffect(() => {
    applyTheme(resolvedTheme());
    localStorage.setItem(STORAGE_KEY, theme());
  });

  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const handler = () => {
    if (theme() === "system") applyTheme(getSystemTheme());
  };
  mq.addEventListener("change", handler);
}
