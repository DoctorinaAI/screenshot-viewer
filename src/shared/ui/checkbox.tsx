import { Checkbox as KCheckbox } from "@kobalte/core/checkbox";
import { Show, splitProps } from "solid-js";
import { cn } from "@/shared/lib/cn";

interface CheckboxProps {
  class?: string;
  label?: string;
  description?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  value?: string;
  error?: string;
}

function Checkbox(props: CheckboxProps) {
  const [local, rest] = splitProps(props, ["class", "label", "description", "error"]);
  return (
    <KCheckbox
      class={cn("flex items-start space-x-3", local.class)}
      validationState={local.error ? "invalid" : undefined}
      {...rest}
    >
      <KCheckbox.Input class="peer" />
      <KCheckbox.Control
        class={cn(
          "h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "ui-disabled:cursor-not-allowed ui-disabled:opacity-50",
          "ui-checked:bg-primary ui-checked:text-primary-foreground",
          "ui-invalid:border-destructive",
        )}
      >
        <KCheckbox.Indicator class="flex items-center justify-center text-current">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="h-3 w-3"
            aria-hidden="true"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </KCheckbox.Indicator>
      </KCheckbox.Control>
      <div class="grid gap-1 leading-none">
        <Show when={local.label}>
          <KCheckbox.Label class="text-sm font-medium leading-none ui-disabled:cursor-not-allowed ui-disabled:opacity-70">
            {local.label}
          </KCheckbox.Label>
        </Show>
        <Show when={local.description}>
          <KCheckbox.Description class="text-sm text-muted-foreground">
            {local.description}
          </KCheckbox.Description>
        </Show>
        <Show when={local.error}>
          <KCheckbox.ErrorMessage class="text-sm text-destructive">
            {local.error}
          </KCheckbox.ErrorMessage>
        </Show>
      </div>
    </KCheckbox>
  );
}

export type { CheckboxProps };
export { Checkbox };
