// i18n is a singleton module — its locale signal is created once at import time
// and reads localStorage/navigator at that moment. We use vi.resetModules() +
// dynamic imports to re-execute it under different environments.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const STORAGE_KEY = "doctorina_locale";

beforeEach(() => {
  localStorage.clear();
  vi.resetModules();
  vi.unstubAllGlobals();
});

afterEach(() => {
  localStorage.clear();
  vi.unstubAllGlobals();
});

describe("initial locale detection", () => {
  it("uses stored locale when present and supported", async () => {
    localStorage.setItem(STORAGE_KEY, "ru");
    const { locale } = await import("./i18n");
    expect(locale()).toBe("ru");
  });

  it("ignores unsupported stored value and falls through to navigator", async () => {
    localStorage.setItem(STORAGE_KEY, "fr");
    vi.stubGlobal("navigator", { language: "es-ES", languages: ["es-ES"] });
    const { locale } = await import("./i18n");
    expect(locale()).toBe("es");
  });

  it("falls back to en when navigator language is unsupported", async () => {
    vi.stubGlobal("navigator", { language: "de-DE", languages: ["de-DE"] });
    const { locale } = await import("./i18n");
    expect(locale()).toBe("en");
  });

  it("picks the first supported entry from navigator.languages", async () => {
    vi.stubGlobal("navigator", { language: "de-DE", languages: ["de-DE", "es-MX", "en-US"] });
    const { locale } = await import("./i18n");
    expect(locale()).toBe("es");
  });
});

describe("setLocale", () => {
  it("updates the signal and persists to localStorage", async () => {
    const { setLocale, locale } = await import("./i18n");
    setLocale("ru");
    expect(locale()).toBe("ru");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("ru");
  });

  it("syncs document.documentElement.lang", async () => {
    const { setLocale } = await import("./i18n");
    setLocale("es");
    expect(document.documentElement.lang).toBe("es");
  });
});

describe("useT", () => {
  it("resolves a known key in the active locale", async () => {
    const { useT, setLocale } = await import("./i18n");
    const t = useT();
    setLocale("en");
    expect(t("brand.fakeBadge")).toBe("FAKE");
    setLocale("ru");
    expect(t("brand.fakeBadge")).toBe("FAKE");
  });

  it("falls back to English when the key is missing in active locale", async () => {
    const { dictionaries } = await import("./locales");
    dictionaries.en["__test.only_en"] = "english only";
    const { useT, setLocale } = await import("./i18n");
    setLocale("ru");
    const t = useT();
    expect(t("__test.only_en")).toBe("english only");
    delete dictionaries.en.__test_only_en;
  });

  it("returns the key itself when missing everywhere", async () => {
    const { useT } = await import("./i18n");
    const t = useT();
    expect(t("__this_key_does_not_exist__")).toBe("__this_key_does_not_exist__");
  });

  it("interpolates {param} placeholders", async () => {
    const { dictionaries } = await import("./locales");
    dictionaries.en["__test.interp"] = "Hello, {name}. You have {n} runs.";
    const { useT, setLocale } = await import("./i18n");
    setLocale("en");
    const t = useT();
    expect(t("__test.interp", { name: "Mike", n: 7 })).toBe("Hello, Mike. You have 7 runs.");
    delete dictionaries.en["__test.interp"];
  });

  it("leaves placeholders intact when no value is provided", async () => {
    const { dictionaries } = await import("./locales");
    dictionaries.en["__test.partial"] = "Hi {missing}";
    const { useT, setLocale } = await import("./i18n");
    setLocale("en");
    const t = useT();
    expect(t("__test.partial", { other: "x" })).toBe("Hi {missing}");
    delete dictionaries.en["__test.partial"];
  });

  it("is reactive — t() resolves against current locale on each call", async () => {
    const { useT, setLocale } = await import("./i18n");
    const t = useT();
    setLocale("en");
    const en = t("brand.name");
    setLocale("es");
    const es = t("brand.name");
    expect(en).not.toBe(es);
  });
});

describe("initLocale", () => {
  it("sets document.documentElement.lang to the current locale", async () => {
    const { initLocale, setLocale } = await import("./i18n");
    setLocale("es");
    document.documentElement.lang = "";
    initLocale();
    expect(document.documentElement.lang).toBe("es");
  });
});
