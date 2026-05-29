import type { JSX } from "solid-js";
import { For } from "solid-js";
import { cn } from "@/shared/lib/cn";
import { setTheme, type Theme, theme } from "@/shared/lib/theme";
import { Button } from "@/shared/ui/button";

interface Option {
  value: Theme;
  label: string;
  icon: () => JSX.Element;
}

const options: ReadonlyArray<Option> = [
  {
    value: "light",
    label: "Light",
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
    label: "System",
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
    label: "Dark",
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

function ThemeSwitcher() {
  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      class="inline-flex items-center rounded-md border bg-muted p-1"
    >
      <For each={options}>
        {(opt) => (
          <Button
            type="button"
            role="radio"
            aria-checked={theme() === opt.value}
            aria-label={opt.label}
            title={opt.label}
            variant="ghost"
            size="icon"
            onClick={() => setTheme(opt.value)}
            class={cn(
              "h-8 w-8 rounded-sm",
              theme() === opt.value && "bg-background text-foreground shadow-sm",
            )}
          >
            {opt.icon()}
          </Button>
        )}
      </For>
    </div>
  );
}

export { ThemeSwitcher };
