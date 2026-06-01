import { Dialog as KDialog } from "@kobalte/core/dialog";
import type { ComponentProps, ParentProps } from "solid-js";
import { splitProps } from "solid-js";
import { cn } from "@/shared/lib/cn";

function Dialog(props: ComponentProps<typeof KDialog>) {
  return <KDialog {...props} />;
}

const DialogTrigger = KDialog.Trigger;

function DialogContent(props: ParentProps<{ class?: string }>) {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return (
    <KDialog.Portal>
      <KDialog.Overlay
        class={cn(
          "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm",
          "data-[expanded]:animate-in data-[expanded]:fade-in-0",
          "data-[closed]:animate-out data-[closed]:fade-out-0",
        )}
      />
      <KDialog.Content
        class={cn(
          // Mobile: near-full-bleed with internal scroll so tall content
          // (e.g. compare panes in the lightbox) never spills off-viewport
          // and the controls at the bottom stay reachable.
          "fixed top-2 right-2 bottom-2 left-2 z-50 grid max-h-[calc(100dvh-1rem)] gap-3 overflow-y-auto",
          // Desktop: centered card with the original sizing. Set each side
          // individually so the sm: overrides win cleanly (shorthand
          // `inset-x-auto` would clobber `left-1/2` once sorted).
          "sm:top-1/2 sm:right-auto sm:bottom-auto sm:left-1/2 sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-h-[calc(100dvh-4rem)] sm:gap-4",
          "rounded-lg border bg-background p-3 shadow-lg duration-200 sm:p-6",
          "data-[expanded]:animate-in data-[expanded]:fade-in-0 data-[expanded]:zoom-in-95",
          "data-[closed]:animate-out data-[closed]:fade-out-0 data-[closed]:zoom-out-95",
          local.class,
        )}
        {...rest}
      >
        {local.children}
        <KDialog.CloseButton
          class={cn(
            "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity",
            "hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          )}
        >
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
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
          <span class="sr-only">Close</span>
        </KDialog.CloseButton>
      </KDialog.Content>
    </KDialog.Portal>
  );
}

function DialogHeader(props: ParentProps<{ class?: string }>) {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return (
    <div class={cn("flex flex-col space-y-1.5 text-center sm:text-left", local.class)} {...rest}>
      {local.children}
    </div>
  );
}

function DialogFooter(props: ParentProps<{ class?: string }>) {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return (
    <div
      class={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", local.class)}
      {...rest}
    >
      {local.children}
    </div>
  );
}

function DialogTitle(props: ParentProps<{ class?: string }>) {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return (
    <KDialog.Title
      class={cn("text-lg font-semibold leading-none tracking-tight", local.class)}
      {...rest}
    >
      {local.children}
    </KDialog.Title>
  );
}

function DialogDescription(props: ParentProps<{ class?: string }>) {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return (
    <KDialog.Description class={cn("text-sm text-muted-foreground", local.class)} {...rest}>
      {local.children}
    </KDialog.Description>
  );
}

export {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
};
