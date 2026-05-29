import { Popover as KPopover } from "@kobalte/core/popover";
import type { ComponentProps, ParentProps } from "solid-js";
import { splitProps } from "solid-js";
import { cn } from "@/shared/lib/cn";

function Popover(props: ComponentProps<typeof KPopover>) {
  return <KPopover {...props} />;
}

const PopoverTrigger = KPopover.Trigger;
const PopoverAnchor = KPopover.Anchor;
const PopoverCloseButton = KPopover.CloseButton;

function PopoverContent(
  props: ParentProps<ComponentProps<typeof KPopover.Content> & { class?: string }>,
) {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return (
    <KPopover.Portal>
      <KPopover.Content
        class={cn(
          "z-50 w-72 rounded-md border bg-popover/95 backdrop-blur-sm p-4 text-popover-foreground shadow-md outline-none",
          "data-[expanded]:animate-in data-[expanded]:fade-in-0 data-[expanded]:zoom-in-95",
          "data-[closed]:animate-out data-[closed]:fade-out-0 data-[closed]:zoom-out-95",
          local.class,
        )}
        {...rest}
      >
        {local.children}
      </KPopover.Content>
    </KPopover.Portal>
  );
}

function PopoverTitle(props: ParentProps<{ class?: string }>) {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return (
    <KPopover.Title class={cn("text-sm font-medium leading-none", local.class)} {...rest}>
      {local.children}
    </KPopover.Title>
  );
}

function PopoverDescription(props: ParentProps<{ class?: string }>) {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return (
    <KPopover.Description class={cn("text-sm text-muted-foreground", local.class)} {...rest}>
      {local.children}
    </KPopover.Description>
  );
}

export {
  Popover,
  PopoverAnchor,
  PopoverCloseButton,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
};
