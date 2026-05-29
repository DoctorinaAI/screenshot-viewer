# UI Kit

Custom component library on top of **Kobalte** (accessibility primitives) + **Tailwind CSS v4** (styling) + **CVA** (variants). Components live in [`src/shared/ui/`](../src/shared/ui/). Showcase route at `/ui-kit`.

The flavour is shadcn — tokens through Tailwind, variants through CVA, headless behaviour through Kobalte. The starting set borrows directly from [foxic/client/src/shared/ui](https://github.com/plugfox/foxic/tree/main/client/src/shared/ui).

## Decision: Kobalte vs plain HTML

| Need | Use |
|---|---|
| Accessible modal with focus trap | Kobalte Dialog |
| Dropdown with keyboard navigation | Kobalte DropdownMenu |
| Custom select with search | Kobalte Select |
| Tooltip with delay / positioning | Kobalte Tooltip |
| Toggle / checkbox / switch | Kobalte Switch or Checkbox |
| Tab navigation | Kobalte Tabs |
| Simple button / card / badge | Plain HTML + Tailwind + CVA |
| Text input / textarea / label | Plain HTML + Tailwind |

Rule: if the component needs a11y patterns you'd otherwise hand-roll (focus trap, ARIA roles, keyboard nav), use Kobalte. Otherwise plain HTML.

## File structure

One file per component:

```
src/shared/ui/
  button.tsx       Component + variants
  card.tsx         Compound: Card, CardHeader, CardContent, CardFooter
  dialog.tsx       Kobalte wrapper
  ...
```

No barrel `index.ts`. Import directly: `import { Button } from "@/shared/ui/button"`.

## Simple component template

```tsx
import { type VariantProps, cva } from "class-variance-authority";
import type { JSX } from "solid-js";
import { splitProps } from "solid-js";
import { cn } from "@/shared/lib/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        outline: "border border-border text-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

interface BadgeProps
  extends JSX.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge(props: BadgeProps) {
  const [local, rest] = splitProps(props, ["variant", "class", "children"]);
  return (
    <span class={cn(badgeVariants({ variant: local.variant }), local.class)} {...rest}>
      {local.children}
    </span>
  );
}
```

## Kobalte wrapper template

```tsx
import { Dialog as KDialog } from "@kobalte/core/dialog";
import type { JSX } from "solid-js";
import { splitProps } from "solid-js";
import { cn } from "@/shared/lib/cn";

export const Dialog = KDialog;
export const DialogTrigger = KDialog.Trigger;
export const DialogPortal = KDialog.Portal;

export function DialogContent(props: KDialog.ContentProps & { class?: string }) {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return (
    <KDialog.Portal>
      <KDialog.Overlay class="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" />
      <KDialog.Content
        class={cn(
          "fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
          "w-full max-w-lg rounded-lg border bg-background p-6 shadow-lg",
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

## Theme tokens

Defined in [`src/index.css`](../src/index.css):

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-status-ok: var(--status-ok);
  --color-status-warning: var(--status-warning);
  --color-status-failed: var(--status-failed);
}

:root {
  --background: oklch(...);
  --foreground: oklch(...);
  /* ... */
}

:root.dark {
  --background: oklch(...);
  /* ... */
}
```

Use `bg-background`, `text-foreground`, `border-border`, `bg-status-failed`, etc. Don't reach for hex values in components.

## Responsive

Mobile-first. Start with the base style and add `sm:` / `md:` / `lg:` / `xl:` modifiers.

```tsx
<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
```

Don't introduce custom breakpoints unless a primitive genuinely needs one.

## Showcase

Route: `/ui-kit`. Lists each component with all its variants — same pattern as foxic's `ui-kit.html`. Used during the design-system milestone as a visual contract and afterwards as a regression check.

## Anti-patterns

- ❌ Importing from `index.ts` barrels.
- ❌ Inlining styles in the page when a primitive exists.
- ❌ Re-implementing focus traps / keyboard nav by hand — use Kobalte.
- ❌ Custom hex colours in components — use the tokens.
- ❌ Hardcoding breakpoint widths — use Tailwind's `sm:`/`md:`/`lg:`.
- ❌ Forgetting `splitProps` and spreading `{...props}` after reading some — breaks reactivity for the rest.
