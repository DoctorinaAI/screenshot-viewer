import { Tooltip as KTooltip } from "@kobalte/core/tooltip";
import type { ComponentProps, ParentProps } from "solid-js";
import { splitProps } from "solid-js";
import { cn } from "@/shared/lib/cn";

function Tooltip(props: ComponentProps<typeof KTooltip>) {
  return <KTooltip gutter={4} {...props} />;
}

const TooltipTrigger = KTooltip.Trigger;

function TooltipContent(props: ParentProps<{ class?: string }>) {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return (
    <KTooltip.Portal>
      <KTooltip.Content
        class={cn(
          "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md",
          "data-[expanded]:animate-in data-[expanded]:fade-in-0 data-[expanded]:zoom-in-95",
          "data-[closed]:animate-out data-[closed]:fade-out-0 data-[closed]:zoom-out-95",
          local.class,
        )}
        {...rest}
      >
        {local.children}
        <KTooltip.Arrow />
      </KTooltip.Content>
    </KTooltip.Portal>
  );
}

export { Tooltip, TooltipContent, TooltipTrigger };
