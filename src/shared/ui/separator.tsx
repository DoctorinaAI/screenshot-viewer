import type { JSX } from "solid-js";
import { splitProps } from "solid-js";
import { cn } from "@/shared/lib/cn";

interface SeparatorProps extends JSX.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
  decorative?: boolean;
}

function Separator(props: SeparatorProps) {
  const [local, rest] = splitProps(props, ["class", "orientation", "decorative"]);
  const orientation = () => local.orientation ?? "horizontal";
  return (
    // biome-ignore lint/a11y/useAriaPropsSupportedByRole: role is dynamic (separator or none)
    <div
      role={local.decorative ? "none" : "separator"}
      aria-orientation={local.decorative ? undefined : orientation()}
      class={cn(
        "shrink-0 bg-border",
        orientation() === "horizontal" ? "h-px w-full" : "h-full w-px",
        local.class,
      )}
      {...rest}
    />
  );
}

export type { SeparatorProps };
export { Separator };
