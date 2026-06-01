// AppBar slot context. Pages register two optional pieces:
//   - a `back` link (label + href) — rendered on the left next to the brand
//   - a `filters` factory — rendered as a popover trigger in the bar
//
// Slots are signals so onCleanup automatically clears them when a page unmounts,
// but `setBack` and `setFilters` return a disposer the page can call early
// (e.g. on grouping change). Pages call onMount → setBack(...), onCleanup → null.

import type { JSX } from "solid-js";
import { createContext, createSignal, onCleanup, useContext } from "solid-js";

export interface AppBarBack {
  href: string;
  labelKey: string;
}

export interface AppBarFilters {
  // i18n key shown on the trigger when no active filter, plus on the popover heading
  labelKey: string;
  // Currently-applied filter label (short string already localized). Optional.
  activeLabel?: () => string | null;
  // Renders the popover body.
  content: () => JSX.Element;
}

interface AppBarContextValue {
  back: () => AppBarBack | null;
  filters: () => AppBarFilters | null;
  setBack: (value: AppBarBack | null) => void;
  setFilters: (value: AppBarFilters | null) => void;
}

const ctx = createContext<AppBarContextValue>();

export function AppBarProvider(props: { children: JSX.Element }) {
  const [back, setBack] = createSignal<AppBarBack | null>(null);
  const [filters, setFilters] = createSignal<AppBarFilters | null>(null);
  return (
    <ctx.Provider value={{ back, filters, setBack, setFilters }}>{props.children}</ctx.Provider>
  );
}

export function useAppBar(): AppBarContextValue {
  const value = useContext(ctx);
  if (!value) throw new Error("useAppBar must be used inside <AppBarProvider>");
  return value;
}

/**
 * Convenience hook for a page: register a back link for the lifetime of the
 * component. Pass null/undefined to skip.
 */
export function useRegisterBack(get: () => AppBarBack | null): void {
  const bar = useAppBar();
  // createEffect would track inside the page; but back link rarely changes,
  // so a simple onMount-style set is enough. Use onCleanup to clear.
  const value = get();
  bar.setBack(value);
  onCleanup(() => bar.setBack(null));
}

/**
 * Convenience hook for a page: register the filters popover content for the
 * lifetime of the component.
 */
export function useRegisterFilters(value: AppBarFilters): void {
  const bar = useAppBar();
  bar.setFilters(value);
  onCleanup(() => bar.setFilters(null));
}
