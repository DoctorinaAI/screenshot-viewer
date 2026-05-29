# Conventions

## File naming

- **kebab-case** for everything: `run-card.tsx`, `auth-provider.tsx`, `firebase.ts`.
- One component per file. No `index.ts` barrels.

## Imports

- Always use the `@/` alias (defined in `vite.config.ts` and `tsconfig.app.json`).
- Direct imports: `import { Button } from "@/shared/ui/button"`. Don't import folders.
- `import type` for type-only imports — `verbatimModuleSyntax` is on in `tsconfig.app.json`.

## Exports

- **Named exports only**, except `src/pages/*.tsx` which use `export default` for `lazy()`.
- Re-exports (`export *`) only if the file is acting as a deliberate facade — typically not needed.

## Folder layout

```
src/
  app/                Router, providers, layouts, auth guard
  features/<name>/    api.ts, types.ts, store.ts?, components/
  pages/<route>.tsx   Lazy-loaded route entry — thin
  shared/
    api/              Firebase clients
    lib/              cn(), zod schemas, format helpers
    ui/               shadcn-style components
```

- A "feature" is a vertical slice — data + components together. Pages compose features; features don't reach across to each other unless via `shared/`.
- Cross-feature shared types or schemas live in `shared/lib/` or `shared/api/`.

## TypeScript

- `strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`, `verbatimModuleSyntax: true`.
- No `any`. Use `unknown` and narrow at the boundary.
- No TS enums. Use `as const` objects + `(typeof X)[keyof typeof X]` type aliases (the pattern in [`manifest-schema.md`](manifest-schema.md)).
- Branded types only when crossing untyped boundaries (e.g. `RunId = string & { __brand: "RunId" }` — optional, use when it pays).

## SolidJS

See [`rules/solidjs.md`](rules/solidjs.md). One-line summary:

> Never destructure props. Use `<Show>`/`<For>`/`<Switch>`. No `useEffect` — use `createEffect` / `onMount` / `onCleanup`.

## Styling

- Tailwind v4. Theme tokens are CSS custom properties (defined in `src/index.css`) referenced from Tailwind via `@theme inline`.
- CVA for component variants. `cn()` from `@/shared/lib/cn` for combining classes — clsx + tailwind-merge.
- Adaptive (mobile-first) — start with the smallest breakpoint and override upward (`sm:`, `md:`, `lg:`, `xl:`).
- Dark mode via `class="dark"` on `<html>`. CSS tokens have `:root.dark { ... }` overrides.

## Components

See [`ui-kit.md`](ui-kit.md). One-line summary:

> Use Kobalte when accessibility patterns (focus trap, ARIA roles, keyboard nav) would otherwise be hand-rolled. Otherwise plain HTML + Tailwind + CVA.

## Tests

- `vitest run` for unit tests. `@solidjs/testing-library` for component tests.
- Co-locate: `button.test.tsx` next to `button.tsx`.
- Schema tests live in `shared/lib/schema.test.ts` — feed real-world manifest fixtures (captured from CI) through Zod and assert no errors.

## Commits

Conventional Commits — see [`.claude/skills/commit-message/SKILL.md`](../.claude/skills/commit-message/SKILL.md).

No "🤖 Generated with Claude Code" footer. No `Co-Authored-By: Claude` trailer.

## i18n

Not on the roadmap. The viewer is internal-only and English-only. If we ever add i18n, mirror foxic's approach (`shared/i18n` with code-generated string tables).
