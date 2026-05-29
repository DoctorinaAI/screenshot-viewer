---
name: add-solid-component
description: Create or modify a SolidJS component for the screenshot-viewer following project rules — no prop destructuring, no useEffect, proper control flow, CVA variants, Kobalte primitives. Use when the user asks to add, create, or modify a component, dialog, button, form, or any .tsx file under src/.
---

# Add SolidJS Component

**Read first**:

- [`docs/rules/solidjs.md`](../../../../docs/rules/solidjs.md) — reactivity rules.
- [`docs/rules/components.md`](../../../../docs/rules/components.md) — UI primitives and variants.
- [`docs/rules/typescript.md`](../../../../docs/rules/typescript.md) — TS conventions.
- [`docs/ui-kit.md`](../../../../docs/ui-kit.md) — existing primitives you can reuse.

Check [`src/shared/ui/`](../../../../src/shared/ui/) first — the component you need may already exist.

## Hard rules

- **Never destructure props** — breaks reactivity. Use `props.field` or `splitProps(props, [...])`.
- **Control flow**: `<Show>`, `<For>`, `<Switch>/<Match>`. Never ternaries-with-JSX or `array.map()` in the template.
- **No `useEffect`** — use `createEffect`, `onMount`, `onCleanup`. React idioms don't apply.
- **File naming**: kebab-case (`run-card.tsx`, not `RunCard.tsx`).
- **Named exports only**. `export default` is reserved for `src/pages/` (lazy-loaded routes).
- **No `any`** — use `unknown` + narrowing. **No TS enums** — use `as const` objects.
- **Mobile-first responsive**. Start with the base class set, override at `sm:`/`md:`/`lg:`/`xl:` as the screen widens.

## Skeleton — simple primitive (button-like)

```tsx
import { type VariantProps, cva } from "class-variance-authority";
import type { JSX } from "solid-js";
import { splitProps } from "solid-js";
import { cn } from "@/shared/lib/cn";

const styles = cva("base-classes", {
  variants: {
    size: { sm: "text-sm", md: "text-base", lg: "text-lg" },
    tone: { neutral: "...", danger: "..." },
  },
  defaultVariants: { size: "md", tone: "neutral" },
});

interface Props extends JSX.HTMLAttributes<HTMLDivElement>, VariantProps<typeof styles> {}

export function MyComponent(props: Props) {
  const [local, rest] = splitProps(props, ["size", "tone", "class", "children"]);
  return (
    <div class={cn(styles({ size: local.size, tone: local.tone }), local.class)} {...rest}>
      {local.children}
    </div>
  );
}
```

## Skeleton — Kobalte wrapper

```tsx
import { Dialog as KDialog } from "@kobalte/core/dialog";
import type { ComponentProps } from "solid-js";
import { splitProps } from "solid-js";
import { cn } from "@/shared/lib/cn";

export const Dialog = KDialog;
export const DialogTrigger = KDialog.Trigger;

export function DialogContent(props: ComponentProps<typeof KDialog.Content>) {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return (
    <KDialog.Portal>
      <KDialog.Overlay class="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" />
      <KDialog.Content
        class={cn("fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2", "border bg-background p-6 shadow-lg rounded-lg", local.class)}
        {...rest}
      >
        {local.children}
      </KDialog.Content>
    </KDialog.Portal>
  );
}
```

## Skeleton — feature component (consumes data)

```tsx
import { Show, For, createResource } from "solid-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";
import { fetchRuns } from "@/features/runs/api";

export function RunList(props: { branch?: string }) {
  const [runs] = createResource(() => props.branch, fetchRuns);

  return (
    <Show when={!runs.loading} fallback={<Skeleton class="h-40" />}>
      <Show when={runs() && runs()!.length > 0} fallback={<EmptyState />}>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <For each={runs()!}>
            {(run) => (
              <Card>
                <CardHeader>
                  <CardTitle>{run.git.branch}</CardTitle>
                </CardHeader>
                <CardContent>{run.git.commitSubject}</CardContent>
              </Card>
            )}
          </For>
        </div>
      </Show>
    </Show>
  );
}
```

## After writing

1. Run `bun run check && bun run typecheck`. Both must pass.
2. If the component is a new primitive (`src/shared/ui/`), add it to the `/ui-kit` showcase route.
3. Visually verify in light + dark themes at 360, 768, 1024, 1280 px widths. The `verify-changes` skill describes the Playwright walk.
