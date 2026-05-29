import { Tabs as KTabs } from "@kobalte/core/tabs";
import type { ComponentProps, ParentProps } from "solid-js";
import { splitProps } from "solid-js";
import { cn } from "@/shared/lib/cn";

function Tabs(props: ComponentProps<typeof KTabs>) {
  return <KTabs {...props} />;
}

function TabsList(props: ParentProps<{ class?: string }>) {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return (
    <KTabs.List
      class={cn(
        "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
        local.class,
      )}
      {...rest}
    >
      {local.children}
    </KTabs.List>
  );
}

function TabsTrigger(props: ComponentProps<typeof KTabs.Trigger> & { class?: string }) {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <KTabs.Trigger
      class={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "ui-disabled:pointer-events-none ui-disabled:opacity-50",
        "ui-selected:bg-background ui-selected:text-foreground ui-selected:shadow-sm",
        local.class,
      )}
      {...rest}
    />
  );
}

function TabsContent(props: ComponentProps<typeof KTabs.Content> & { class?: string }) {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <KTabs.Content
      class={cn(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        local.class,
      )}
      {...rest}
    />
  );
}

export { Tabs, TabsContent, TabsList, TabsTrigger };
