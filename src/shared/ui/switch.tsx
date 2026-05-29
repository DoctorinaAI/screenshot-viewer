import { Switch as KSwitch } from "@kobalte/core/switch";
import { Show, splitProps } from "solid-js";
import { cn } from "@/shared/lib/cn";

interface SwitchProps {
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
}

function Switch(props: SwitchProps) {
  const [local, rest] = splitProps(props, ["class", "label", "description"]);
  return (
    <KSwitch class={cn("flex items-center space-x-3", local.class)} {...rest}>
      <KSwitch.Input class="peer" />
      <KSwitch.Control
        class={cn(
          "inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent",
          "bg-input transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "ui-disabled:cursor-not-allowed ui-disabled:opacity-50",
          "ui-checked:bg-primary",
        )}
      >
        <KSwitch.Thumb
          class={cn(
            "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform",
            "translate-x-0 ui-checked:translate-x-5",
          )}
        />
      </KSwitch.Control>
      <div class="grid gap-1">
        <Show when={local.label}>
          <KSwitch.Label class="text-sm font-medium leading-none ui-disabled:cursor-not-allowed ui-disabled:opacity-70">
            {local.label}
          </KSwitch.Label>
        </Show>
        <Show when={local.description}>
          <KSwitch.Description class="text-sm text-muted-foreground">
            {local.description}
          </KSwitch.Description>
        </Show>
      </div>
    </KSwitch>
  );
}

export type { SwitchProps };
export { Switch };
