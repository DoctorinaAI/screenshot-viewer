# Doctorina Screenshot Viewer — Agent Guide

TypeScript SPA for viewing Flutter integration-test screenshot artifacts. Reads Firestore (run index) and Cloud Storage (`manifest.json` + `images.zip`) provisioned by `DoctorinaAI/doctorina`. Designed under [`DoctorinaAI/doctorina#3695`](https://github.com/DoctorinaAI/doctorina/issues/3695).

## What this app does

1. Engineer opens the SPA, signs in with Google (Firebase Auth).
2. Rules gate everything behind `request.auth.token.email` ending in `@doctorina.com`.
3. Landing: Firestore query `runs/` ordered by `createdAt DESC`, filterable by branch / trigger / status / app version / author / language. Cards render purely from Firestore data — **no Storage fetches on the landing page**.
4. Run page: on card click, fetch the run's `manifest.json` (~200–400 KB) from Storage. All grouping / filtering happens client-side over the in-memory manifest. Lazy-fetch the `images.zip` when the user actually wants to see pixels; unzip in-browser via `fflate`.
5. Grouping modes surfaced from manifest:
   - **By case** → compare languages × layouts
   - **By language** → compare cases × layouts
   - **By layout** → compare cases × languages
   - "What changed across languages" = filter to cases where `(caseId, layoutId)` group has > 1 unique `imageHash`.

## Hard rules (read before writing code)

| Rule | Why | Where |
|---|---|---|
| Never destructure props | SolidJS reactivity breaks | [`docs/rules/solidjs.md`](docs/rules/solidjs.md) |
| Control flow via `<Show>`, `<For>`, `<Switch>` | Ternaries / `.map()` bypass fine-grained reactivity | [`docs/rules/solidjs.md`](docs/rules/solidjs.md) |
| No `useEffect` | SolidJS uses `createEffect`, `onMount`, `onCleanup` | [`docs/rules/solidjs.md`](docs/rules/solidjs.md) |
| No `any` — use `unknown` + narrowing | Type safety | [`docs/rules/typescript.md`](docs/rules/typescript.md) |
| No TS enums — `as const` objects | Tree-shaking + erasable syntax | [`docs/rules/typescript.md`](docs/rules/typescript.md) |
| File names kebab-case | Convention | [`docs/conventions.md`](docs/conventions.md) |
| Named exports only (except `pages/`) | `pages/` uses `default` for lazy() | [`docs/conventions.md`](docs/conventions.md) |
| Build the UI from components in `src/shared/ui/` | Design-system-first | [`docs/ui-kit.md`](docs/ui-kit.md) |
| Adaptive (mobile-first) layout everywhere | All screens responsive | [`docs/rules/tailwind.md`](docs/rules/tailwind.md) |
| Validate every Storage payload with Zod | Manifest may evolve, fail loudly on schema drift | [`docs/manifest-schema.md`](docs/manifest-schema.md) |
| Auth guard at the router level | No data fetch fires for unauthorized users | [`docs/firebase.md`](docs/firebase.md) |

## File-level conventions

- **Components**: one file per component in `src/shared/ui/<name>.tsx`. No barrel `index.ts`. Import directly: `import { Button } from "@/shared/ui/button"`.
- **Feature modules** in `src/features/<feature>/` each contain: `api.ts`, `types.ts`, `store.ts` (if stateful), `components/`.
- **Pages** in `src/pages/<route>.tsx` are thin — they compose feature components and use `export default` for `lazy()`.

## Commands

```fish
bun install                    # deps
bun run dev                    # http://localhost:5173
bun run check                  # biome lint + format check
bun run typecheck              # tsc --noEmit
bun run test                   # vitest run
bun run build                  # production bundle
firebase deploy --only firestore:rules,firestore:indexes,storage --project doctorina-test  # rules + indexes
firebase deploy --only hosting --project doctorina-test                                     # ship the SPA
```

## Pointers

- Architecture: [`docs/architecture.md`](docs/architecture.md)
- Manifest + RunDoc schemas: [`docs/manifest-schema.md`](docs/manifest-schema.md)
- Firebase config + rules: [`docs/firebase.md`](docs/firebase.md)
- UI kit: [`docs/ui-kit.md`](docs/ui-kit.md)
- Conventions: [`docs/conventions.md`](docs/conventions.md)
- Roadmap: [`ROADMAP.md`](ROADMAP.md)
- Design vision: [`DESIGN.md`](DESIGN.md)
