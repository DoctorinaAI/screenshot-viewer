import { Select as KSelect } from "@kobalte/core/select";
import { Show, splitProps } from "solid-js";
import { cn } from "@/shared/lib/cn";

interface SelectProps<T extends string> {
  class?: string;
  options: T[];
  value?: T;
  defaultValue?: T;
  onChange?: (value: T | null) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  getLabel?: (value: T) => string;
  optionDisabled?: (value: T) => boolean;
}

function Select<T extends string>(props: SelectProps<T>) {
  const [local, rest] = splitProps(props, [
    "class",
    "label",
    "error",
    "placeholder",
    "options",
    "getLabel",
  ]);
  return (
    <KSelect<T>
      multiple={false}
      options={local.options}
      optionValue={(v: T) => v}
      optionTextValue={(v: T) => (local.getLabel ? local.getLabel(v) : v)}
      validationState={local.error ? "invalid" : undefined}
      placeholder={local.placeholder}
      itemComponent={(itemProps) => (
        <KSelect.Item
          item={itemProps.item}
          class={cn(
            "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none",
            "ui-highlighted:bg-accent ui-highlighted:text-accent-foreground",
            "ui-disabled:pointer-events-none ui-disabled:opacity-50",
          )}
        >
          <span class="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
            <KSelect.ItemIndicator>
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
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </KSelect.ItemIndicator>
          </span>
          <KSelect.ItemLabel>
            {local.getLabel ? local.getLabel(itemProps.item.rawValue) : itemProps.item.rawValue}
          </KSelect.ItemLabel>
        </KSelect.Item>
      )}
      {...rest}
    >
      <div class={cn("grid w-full gap-1.5", local.class)}>
        <Show when={local.label}>
          <KSelect.Label class="text-sm font-medium leading-none">{local.label}</KSelect.Label>
        </Show>
        <KSelect.Trigger
          class={cn(
            "flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
            "placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            "ui-disabled:cursor-not-allowed ui-disabled:opacity-50",
            "ui-invalid:border-destructive",
          )}
        >
          <KSelect.Value<T> class="ui-placeholder-shown:text-muted-foreground">
            {(state) => {
              const val = state.selectedOption();
              return val && local.getLabel ? local.getLabel(val) : val;
            }}
          </KSelect.Value>
          <KSelect.Icon class="flex h-4 w-4 items-center justify-center opacity-50">
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
              <path d="m6 9 6 6 6-6" />
            </svg>
          </KSelect.Icon>
        </KSelect.Trigger>
        <Show when={local.error}>
          <KSelect.ErrorMessage class="text-sm text-destructive">
            {local.error}
          </KSelect.ErrorMessage>
        </Show>
      </div>
      <KSelect.Portal>
        <KSelect.Content
          class={cn(
            "relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md",
            "animate-in fade-in-0 zoom-in-95",
          )}
        >
          <KSelect.Listbox class="p-1" />
        </KSelect.Content>
      </KSelect.Portal>
    </KSelect>
  );
}

export type { SelectProps };
export { Select };
