# Tailwind Rules

Tailwind CSS v4 with the Vite plugin (`@tailwindcss/vite`). Theme tokens live in `src/index.css` and are exposed via the v4 `@theme inline { ... }` syntax.

## Mobile-first, always

Start with the smallest layout and add `sm:` / `md:` / `lg:` / `xl:` modifiers as the screen widens. Never start with a desktop layout and shrink down.

```tsx
// CORRECT
<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

// WRONG — desktop-first, breaks on phones
<div class="grid grid-cols-4 gap-3 lg:grid-cols-3 sm:grid-cols-1">
```

Tailwind breakpoints are min-width queries. Stack them in ascending order.

## Breakpoints we actually use

| Token | Width | Where |
|---|---|---|
| (base) | < 640 px | mobile portrait |
| `sm` | ≥ 640 px | mobile landscape, small tablets |
| `md` | ≥ 768 px | tablets, narrow laptops |
| `lg` | ≥ 1024 px | typical laptops |
| `xl` | ≥ 1280 px | desktops |

`2xl` exists but we don't target it. Don't introduce custom breakpoints — if a layout needs one, design at one of the existing tiers instead.

## Theme tokens, not raw colours

```tsx
// WRONG
<div class="bg-white text-gray-900 border-gray-200">

// CORRECT
<div class="bg-background text-foreground border-border">
```

Status colours have dedicated tokens:

```tsx
<Badge class="bg-status-ok text-status-ok-foreground">ok</Badge>
<Badge class="bg-status-failed text-status-failed-foreground">failed</Badge>
```

If a token doesn't exist for a use case, add it to `src/index.css` rather than reaching for a raw colour.

## Dark mode

Triggered by `class="dark"` on `<html>`. The token definitions in `src/index.css` have a `:root.dark { ... }` block. Tailwind utilities just consume the tokens — there's almost never a need for `dark:` modifiers in component code.

```tsx
// Don't do this — tokens already handle theming
<div class="bg-white dark:bg-black">

// Do this — token swaps automatically
<div class="bg-background">
```

The only valid `dark:` use is for things outside the token system, like a specific stroke colour in an SVG illustration.

## CVA over conditional class strings

```tsx
// WRONG
<button class={`rounded px-3 ${size === "lg" ? "h-10 text-base" : "h-8 text-sm"}`}>

// CORRECT — CVA in src/shared/ui/button.tsx, then:
<Button size="lg">Click</Button>
```

Components in `src/shared/ui/` own their variants via CVA. Pages and feature modules pick variants, not class strings.

## `cn()` for composing

```tsx
import { cn } from "@/shared/lib/cn";

<div class={cn("rounded-lg border p-4", local.class)}>
```

`cn` is `clsx + tailwind-merge`: later utilities win when they conflict. That's how variant + caller override works without `!important`.

## What not to do

- ❌ Custom breakpoints (`screens: { ... }` in config).
- ❌ Arbitrary values everywhere (`w-[427px]`). Use them sparingly for one-off pixel constraints; prefer spacing scale (`w-96` etc.).
- ❌ `!important` (`!w-full`). Restructure variants instead.
- ❌ `@apply` in component CSS to "DRY up" classes. CVA does that better and stays inspectable.
- ❌ `space-x-*` / `space-y-*` for layout — use `flex gap-*` / `grid gap-*`. Spacing utilities accidentally apply margins to children, which conflict with absolute positioning.

## When to write `@layer base` CSS

In `src/index.css`. Examples:

- `:root` token definitions.
- Global element resets (`html`, `body`).
- Font-face declarations.
- A handful of `@keyframes` for shared animations.

Everything else is utility classes on the markup.

## Verifying responsive layout

After landing a layout change, **walk through the breakpoints** in Playwright (via MCP) or DevTools:

- 360 × 640 (phone portrait)
- 768 × 1024 (tablet)
- 1280 × 800 (laptop)
- 1920 × 1080 (desktop)

The `verify-changes` skill describes the playwright walk pattern.
