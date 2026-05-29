import { DropdownMenu as KMenu } from "@kobalte/core/dropdown-menu";
import type { ComponentProps, ParentProps } from "solid-js";
import { splitProps } from "solid-js";
import { cn } from "@/shared/lib/cn";

function DropdownMenu(props: ComponentProps<typeof KMenu>) {
  return <KMenu {...props} />;
}

const DropdownMenuTrigger = KMenu.Trigger;
const DropdownMenuGroup = KMenu.Group;
const DropdownMenuSub = KMenu.Sub;
const DropdownMenuRadioGroup = KMenu.RadioGroup;

function DropdownMenuContent(props: ParentProps<{ class?: string }>) {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return (
    <KMenu.Portal>
      <KMenu.Content
        class={cn(
          "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover/95 backdrop-blur-sm p-1 text-popover-foreground shadow-md",
          "data-[expanded]:animate-in data-[expanded]:fade-in-0 data-[expanded]:zoom-in-95",
          "data-[closed]:animate-out data-[closed]:fade-out-0 data-[closed]:zoom-out-95",
          local.class,
        )}
        {...rest}
      >
        {local.children}
      </KMenu.Content>
    </KMenu.Portal>
  );
}

function DropdownMenuItem(
  props: ComponentProps<typeof KMenu.Item> & { class?: string; inset?: boolean },
) {
  const [local, rest] = splitProps(props, ["class", "inset"]);
  return (
    <KMenu.Item
      class={cn(
        "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
        "ui-highlighted:bg-accent ui-highlighted:text-accent-foreground",
        "ui-disabled:pointer-events-none ui-disabled:opacity-50",
        local.inset && "pl-8",
        local.class,
      )}
      {...rest}
    />
  );
}

function DropdownMenuCheckboxItem(
  props: ComponentProps<typeof KMenu.CheckboxItem> & { class?: string },
) {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return (
    <KMenu.CheckboxItem
      class={cn(
        "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors",
        "ui-highlighted:bg-accent ui-highlighted:text-accent-foreground",
        "ui-disabled:pointer-events-none ui-disabled:opacity-50",
        local.class,
      )}
      {...rest}
    >
      <span class="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <KMenu.ItemIndicator>
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
        </KMenu.ItemIndicator>
      </span>
      {local.children}
    </KMenu.CheckboxItem>
  );
}

function DropdownMenuRadioItem(props: ComponentProps<typeof KMenu.RadioItem> & { class?: string }) {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return (
    <KMenu.RadioItem
      class={cn(
        "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors",
        "ui-highlighted:bg-accent ui-highlighted:text-accent-foreground",
        "ui-disabled:pointer-events-none ui-disabled:opacity-50",
        local.class,
      )}
      {...rest}
    >
      <span class="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <KMenu.ItemIndicator>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            class="h-2 w-2 fill-current"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="6" />
          </svg>
        </KMenu.ItemIndicator>
      </span>
      {local.children}
    </KMenu.RadioItem>
  );
}

function DropdownMenuLabel(props: ParentProps<{ class?: string; inset?: boolean }>) {
  const [local, rest] = splitProps(props, ["class", "inset", "children"]);
  return (
    <KMenu.GroupLabel
      class={cn("px-2 py-1.5 text-sm font-semibold", local.inset && "pl-8", local.class)}
      {...rest}
    >
      {local.children}
    </KMenu.GroupLabel>
  );
}

function DropdownMenuSeparator(props: { class?: string }) {
  const [local, rest] = splitProps(props, ["class"]);
  return <KMenu.Separator class={cn("-mx-1 my-1 h-px bg-muted", local.class)} {...rest} />;
}

function DropdownMenuShortcut(props: ParentProps<{ class?: string }>) {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return (
    <span class={cn("ml-auto text-xs tracking-widest opacity-60", local.class)} {...rest}>
      {local.children}
    </span>
  );
}

export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuTrigger,
};
