// Sticky app bar. Renders brand + nav + (optional) back link + (optional)
// filters popover + account menu. Filters and back are injected by pages via
// AppBarContext, so layout doesn't have to know about page-specific UI.
//
// Mobile-first: at 360 px wide, nav links collapse out, brand text shrinks to
// just the dot, and the filters trigger shows the icon-only variant. Account
// menu is always the avatar circle so it survives the smallest viewport.

import { A } from "@solidjs/router";
import { Show } from "solid-js";
import { AccountMenu } from "@/app/account-menu";
import { useAppBar } from "@/app/app-bar-context";
import { useAuth } from "@/features/auth/store";
import { USE_FAKE_BACKEND } from "@/shared/api/backend";
import { useT } from "@/shared/lib/i18n";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "@/shared/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";

function AppBar() {
  const t = useT();
  const auth = useAuth();
  const bar = useAppBar();
  return (
    <header class="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div class="mx-auto flex h-14 w-full max-w-screen-2xl items-center gap-2 px-3 sm:gap-3 sm:px-6">
        <BrandLink />
        <Show when={bar.back()}>
          {(back) => (
            <Tooltip>
              <TooltipTrigger
                as={A}
                href={back().href}
                class="inline-flex h-9 select-none items-center gap-1.5 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                aria-label={t(back().labelKey)}
              >
                <BackIcon />
                <span class="hidden sm:inline">{t(back().labelKey)}</span>
              </TooltipTrigger>
              <TooltipContent>{t(back().labelKey)}</TooltipContent>
            </Tooltip>
          )}
        </Show>
        <Show when={auth.user()}>
          <nav class="ml-1 hidden gap-1 text-sm text-muted-foreground md:flex" aria-label="Primary">
            <A
              href="/"
              end
              class="select-none rounded-md px-2 py-1 hover:bg-accent hover:text-foreground aria-[current=page]:text-foreground"
              activeClass="text-foreground"
            >
              {t("nav.runs")}
            </A>
            <A
              href="/ui-kit"
              class="select-none rounded-md px-2 py-1 hover:bg-accent hover:text-foreground aria-[current=page]:text-foreground"
              activeClass="text-foreground"
            >
              {t("nav.uiKit")}
            </A>
          </nav>
        </Show>
        <div class="ml-auto flex items-center gap-1 sm:gap-2">
          <Show when={bar.filters()}>
            {(f) => (
              <Popover>
                <PopoverTrigger
                  as={Button}
                  variant="outline"
                  size="sm"
                  class="h-9 select-none gap-1.5 px-2 sm:px-3"
                  aria-label={t(f().labelKey)}
                >
                  <FilterIcon />
                  <span class="hidden sm:inline">{t(f().labelKey)}</span>
                  <Show when={f().activeLabel?.()}>
                    {(label) => (
                      <Badge
                        variant="secondary"
                        class="hidden max-w-[10rem] truncate sm:inline-flex"
                      >
                        {label()}
                      </Badge>
                    )}
                  </Show>
                  <Show when={f().activeLabel?.()}>
                    <span
                      class="inline-block h-2 w-2 rounded-full bg-primary sm:hidden"
                      aria-hidden="true"
                    />
                  </Show>
                </PopoverTrigger>
                <PopoverContent class="w-[min(22rem,calc(100vw-1.5rem))]">
                  <div class="grid gap-3">
                    <PopoverTitle>{t(f().labelKey)}</PopoverTitle>
                    <Show when={f() && "subtitleKey" in (f() as object)}>
                      <PopoverDescription>{t("filters.subtitle")}</PopoverDescription>
                    </Show>
                    {f().content()}
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </Show>
          <AccountMenu />
        </div>
      </div>
    </header>
  );
}

function BrandLink() {
  const t = useT();
  return (
    <A
      href="/"
      class="flex select-none items-center gap-2 font-semibold tracking-tight"
      aria-label={t("brand.name")}
    >
      <span aria-hidden="true" class="inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
      <span class="hidden truncate sm:inline">{t("brand.name")}</span>
      <Show when={USE_FAKE_BACKEND}>
        <Tooltip openDelay={250}>
          <TooltipTrigger
            as={Badge}
            variant="warning"
            class="ml-1 font-mono text-[10px] tracking-wider"
            title={t("brand.fakeTooltip")}
            aria-label={t("brand.fakeTooltip")}
          >
            {t("brand.fakeBadge")}
          </TooltipTrigger>
          <TooltipContent>{t("brand.fakeTooltip")}</TooltipContent>
        </Tooltip>
      </Show>
    </A>
  );
}

function FilterIcon() {
  return (
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
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

function BackIcon() {
  return (
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
      <line x1="19" x2="5" y1="12" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

export { AppBar };
