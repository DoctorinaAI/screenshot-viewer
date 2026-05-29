import type { JSX } from "solid-js";
import { splitProps } from "solid-js";
import { cn } from "@/shared/lib/cn";

function Label(props: JSX.LabelHTMLAttributes<HTMLLabelElement>) {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: generic Label, `for` is passed by consumer
    <label
      class={cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        local.class,
      )}
      {...rest}
    >
      {local.children}
    </label>
  );
}

export { Label };
