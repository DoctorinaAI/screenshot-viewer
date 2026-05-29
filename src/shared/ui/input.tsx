import type { JSX } from "solid-js";
import { Show, splitProps } from "solid-js";
import { cn } from "@/shared/lib/cn";

interface InputProps extends JSX.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

function Input(props: InputProps) {
  const [local, rest] = splitProps(props, ["class", "label", "error", "id"]);
  const inputId = () => local.id ?? local.label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div class="grid w-full gap-1.5">
      <Show when={local.label}>
        <label for={inputId()} class="text-sm font-medium leading-none">
          {local.label}
        </label>
      </Show>
      <input
        id={inputId()}
        class={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          local.error && "border-destructive focus-visible:ring-destructive",
          local.class,
        )}
        aria-invalid={local.error ? true : undefined}
        aria-describedby={local.error ? `${inputId()}-error` : undefined}
        {...rest}
      />
      <Show when={local.error}>
        <p id={`${inputId()}-error`} class="text-sm text-destructive">
          {local.error}
        </p>
      </Show>
    </div>
  );
}

export type { InputProps };
export { Input };
