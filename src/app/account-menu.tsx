// User-avatar dropdown that bundles account info, theme switcher, language
// switcher, and sign-out. Replaces the standalone ThemeSwitcher + SignOutMenu
// in the app bar. On narrow viewports the dropdown stays compact; the trigger
// is just the avatar (no text), so it fits at 360 px.

import { For, type JSX, Show } from "solid-js";
import { useAuth } from "@/features/auth/store";
import {
  LOCALE_NAMES,
  type Locale,
  locale,
  SUPPORTED_LOCALES,
  setLocale,
  useT,
} from "@/shared/lib/i18n";
import { setTheme, type Theme, theme } from "@/shared/lib/theme";
import { Avatar } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

function initialsFor(displayName: string | null, email: string | null) {
  const source = displayName ?? email ?? "?";
  const parts = source.split(/[\s.@]+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

interface ThemeOption {
  value: Theme;
  labelKey: string;
  icon: () => JSX.Element;
}

const THEMES: ReadonlyArray<ThemeOption> = [
  {
    value: "light",
    labelKey: "settings.theme.light",
    icon: () => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="h-4 w-4"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </svg>
    ),
  },
  {
    value: "system",
    labelKey: "settings.theme.system",
    icon: () => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="h-4 w-4"
        aria-hidden="true"
      >
        <rect width="20" height="14" x="2" y="3" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    ),
  },
  {
    value: "dark",
    labelKey: "settings.theme.dark",
    icon: () => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="h-4 w-4"
        aria-hidden="true"
      >
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
      </svg>
    ),
  },
];

function AccountMenu() {
  const auth = useAuth();
  const t = useT();
  return (
    <Show
      when={auth.user()}
      fallback={
        <DropdownMenu>
          <DropdownMenuTrigger
            as={Button}
            variant="ghost"
            size="icon"
            class="h-9 w-9 rounded-full p-0 select-none"
            aria-label={t("common.openMenu")}
          >
            <Avatar size="sm" src={null} fallback="?" />
          </DropdownMenuTrigger>
          <DropdownMenuContent class="w-64">
            <PreferencesPanel />
          </DropdownMenuContent>
        </DropdownMenu>
      }
    >
      {(user) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            as={Button}
            variant="ghost"
            size="icon"
            class="h-9 w-9 rounded-full p-0 select-none"
            aria-label={t("common.openMenu")}
          >
            <Avatar
              size="sm"
              src={user().photoURL}
              alt={user().displayName ?? user().email ?? ""}
              fallback={initialsFor(user().displayName, user().email)}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent class="w-64">
            <DropdownMenuLabel>
              <div class="grid gap-0.5">
                <span class="truncate font-medium">
                  {user().displayName ?? t("common.engineer")}
                </span>
                <Show when={user().email}>
                  <span class="truncate text-xs text-muted-foreground">{user().email}</span>
                </Show>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <PreferencesPanel />
            <DropdownMenuSeparator />
            <DropdownMenuItem
              class="cursor-pointer"
              onSelect={() => {
                void auth.signOut();
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="mr-2 h-4 w-4"
                aria-hidden="true"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" x2="9" y1="12" y2="12" />
              </svg>
              {t("common.signOut")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </Show>
  );
}

function PreferencesPanel() {
  const t = useT();
  return (
    <div class="grid gap-2 px-2 py-1.5">
      <SectionLabel>{t("settings.appearance")}</SectionLabel>
      <div role="radiogroup" aria-label={t("settings.appearance")} class="grid grid-cols-3 gap-1">
        <For each={THEMES}>
          {(opt) => (
            <Button
              type="button"
              role="radio"
              aria-checked={theme() === opt.value}
              aria-label={t(opt.labelKey)}
              title={t(opt.labelKey)}
              variant={theme() === opt.value ? "default" : "outline"}
              size="sm"
              class="h-8 select-none px-0"
              onClick={() => setTheme(opt.value)}
            >
              {opt.icon()}
            </Button>
          )}
        </For>
      </div>
      <SectionLabel>{t("settings.language")}</SectionLabel>
      <div role="radiogroup" aria-label={t("settings.language")} class="grid grid-cols-3 gap-1">
        <For each={SUPPORTED_LOCALES}>
          {(code) => (
            <LocaleButton code={code} active={locale() === code} onSelect={() => setLocale(code)} />
          )}
        </For>
      </div>
    </div>
  );
}

function LocaleButton(props: { code: Locale; active: boolean; onSelect: () => void }) {
  const meta = () => LOCALE_NAMES[props.code];
  return (
    <Button
      type="button"
      role="radio"
      aria-checked={props.active}
      title={meta().native}
      variant={props.active ? "default" : "outline"}
      size="sm"
      class="h-8 select-none gap-1 px-2 text-xs font-medium"
      onClick={props.onSelect}
    >
      <span aria-hidden="true">{meta().flag}</span>
      <span class="uppercase">{props.code}</span>
    </Button>
  );
}

function SectionLabel(props: { children: JSX.Element }) {
  return (
    <div class="select-none text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
      {props.children}
    </div>
  );
}

export { AccountMenu };
