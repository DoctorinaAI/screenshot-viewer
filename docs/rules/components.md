# UI Component Rules

Read this file before creating or modifying components in `src/shared/ui/`.

## When to use Kobalte vs plain HTML

| Need | Use |
|---|---|
| Accessible modal with focus trap | Kobalte Dialog |
| Dropdown with keyboard navigation | Kobalte DropdownMenu |
| Custom select with search | Kobalte Select |
| Toast notifications | Kobalte Toast |
| Tooltip with delay / positioning | Kobalte Tooltip |
| Toggle / checkbox / switch | Kobalte Switch or Checkbox |
| Simple button / card / badge | Plain HTML + Tailwind + CVA |
| Text input / textarea | Plain HTML + Tailwind |

Rule: if the component needs a11y patterns you'd otherwise hand-roll, use Kobalte. Otherwise plain HTML.

## Anatomy of a simple component

```tsx
import { type VariantProps, cva } from "class-variance-authority";
import type { JSX } from "solid-js";
import { splitProps } from "solid-js";
import { cn } from "@/shared/lib/cn";

// 1. Variants
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-9 px-4",
        lg: "h-10 px-6",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  },
);

// 2. Props
interface ButtonProps
  extends JSX.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

// 3. Component
export function Button(props: ButtonProps) {
  const [local, rest] = splitProps(props, ["variant", "size", "class", "children"]);
  return (
    <button
      class={cn(buttonVariants({ variant: local.variant, size: local.size }), local.class)}
      {...rest}
    >
      {local.children}
    </button>
  );
}
```

Key points:

- Variants in CVA. Defaults declared via `defaultVariants`.
- Props extend the native element type + `VariantProps<typeof variants>`.
- Always `splitProps` to peel off styling props before spreading the rest onto the element.
- Always pass `local.class` through `cn()` so callers can append / override classes.

## Compound components (e.g. Card)

```tsx
import type { JSX } from "solid-js";
import { splitProps } from "solid-js";
import { cn } from "@/shared/lib/cn";

export function Card(props: JSX.HTMLAttributes<HTMLDivElement>) {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return (
    <div class={cn("rounded-lg border bg-card text-card-foreground shadow-sm", local.class)} {...rest}>
      {local.children}
    </div>
  );
}

export function CardHeader(props: JSX.HTMLAttributes<HTMLDivElement>) {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return (
    <div class={cn("flex flex-col space-y-1.5 p-6", local.class)} {...rest}>
      {local.children}
    </div>
  );
}

export function CardTitle(props: JSX.HTMLAttributes<HTMLHeadingElement>) {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return (
    <h3 class={cn("text-lg font-semibold leading-none tracking-tight", local.class)} {...rest}>
      {local.children}
    </h3>
  );
}

// ... CardDescription, CardContent, CardFooter follow the same pattern
```

Compose at the call site:

```tsx
<Card>
  <CardHeader>
    <CardTitle>Run on develop</CardTitle>
    <CardDescription>2 min ago • Mikhail</CardDescription>
  </CardHeader>
  <CardContent>...</CardContent>
</Card>
```

## Kobalte wrapper components

Re-export Kobalte parts directly when they don't need styling; wrap the styled parts (typically `Content`, `Overlay`).

```tsx
import { Dialog as KDialog } from "@kobalte/core/dialog";
import type { ComponentProps } from "solid-js";
import { splitProps } from "solid-js";
import { cn } from "@/shared/lib/cn";

export const Dialog = KDialog;
export const DialogTrigger = KDialog.Trigger;
export const DialogClose = KDialog.CloseButton;

export function DialogContent(props: ComponentProps<typeof KDialog.Content>) {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return (
    <KDialog.Portal>
      <KDialog.Overlay class="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm data-[expanded]:animate-in data-[closed]:animate-out" />
      <KDialog.Content
        class={cn(
          "fixed top-1/2 left-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4",
          "border bg-background p-6 shadow-lg sm:rounded-lg",
          local.class,
        )}
        {...rest}
      >
        {local.children}
      </KDialog.Content>
    </KDialog.Portal>
  );
}
```

Kobalte uses `data-*` attributes for state — style them with `data-[state=open]:...`.

## What every component must do

- [ ] Accept `class` and merge it via `cn()`.
- [ ] Forward unknown props via `{...rest}` after `splitProps`.
- [ ] Provide variants through CVA, not inline conditional class strings.
- [ ] Look correct in **both** light and dark themes (test on the `/ui-kit` page).
- [ ] Be keyboard-operable. For native elements that's free; for Kobalte that's free; for everything else, audit before merging.
- [ ] Have at least one entry on the `/ui-kit` showcase route.

## What no component should do

- ❌ Read from a global store / context. Components are pure visual primitives.
- ❌ Fetch data. That's the feature module's job.
- ❌ Use absolute positioning to escape its container unless it's an overlay (Dialog / Popover / Tooltip).
- ❌ Hardcode breakpoints — use Tailwind's `sm:`/`md:`/`lg:`/`xl:`.
- ❌ Hardcode colours — use theme tokens.
