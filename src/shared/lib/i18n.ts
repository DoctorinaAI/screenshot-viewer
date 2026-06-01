// Tiny SolidJS i18n. No library — a signal-backed locale + flat dictionaries
// keyed by string. Persisted in localStorage; first-run picks browser language
// when it matches a supported locale, otherwise English.
//
// Usage:
//   const t = useT();
//   t("home.title")
//   t("runs.count", { n: 12 })            // {n} placeholders
//   setLocale("ru")                       // persists + reactive

import { createSignal } from "solid-js";
import { dictionaries, LOCALE_NAMES, type Locale, SUPPORTED_LOCALES } from "./locales";

const STORAGE_KEY = "doctorina_locale";

function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (SUPPORTED_LOCALES as ReadonlyArray<string>).includes(value);
}

function detectInitialLocale(): Locale {
  if (typeof localStorage !== "undefined") {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isLocale(stored)) return stored;
  }
  if (typeof navigator !== "undefined") {
    const candidates = [navigator.language, ...(navigator.languages ?? [])];
    for (const raw of candidates) {
      const base = raw.toLowerCase().split("-")[0];
      if (isLocale(base)) return base;
    }
  }
  return "en";
}

const [locale, setLocaleSignal] = createSignal<Locale>(detectInitialLocale());

export type { Locale };
export { LOCALE_NAMES, locale, SUPPORTED_LOCALES };

export function setLocale(next: Locale): void {
  setLocaleSignal(next);
  if (typeof localStorage !== "undefined") localStorage.setItem(STORAGE_KEY, next);
  if (typeof document !== "undefined") document.documentElement.lang = next;
}

type Params = Record<string, string | number>;

function interpolate(template: string, params?: Params): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const v = params[key];
    return v === undefined ? `{${key}}` : String(v);
  });
}

/**
 * Resolve a key in the current locale. Falls back to English if a key is
 * missing in the active locale, and to the key itself as a last resort —
 * loud enough to notice during development without crashing the UI.
 */
export function useT(): (key: string, params?: Params) => string {
  return (key, params) => {
    const active = locale();
    const dict = dictionaries[active];
    const fallback = dictionaries.en;
    const raw = dict[key] ?? fallback[key] ?? key;
    return interpolate(raw, params);
  };
}

export function initLocale(): void {
  if (typeof document !== "undefined") document.documentElement.lang = locale();
}
