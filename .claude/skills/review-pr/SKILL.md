---
name: review-pr
description: Review a pull request (or the current branch's diff) against the screenshot-viewer's rule files. Use when the user asks to review a PR, audit a branch, or check whether changes follow conventions.
---

# Review PR

Goal: catch rule violations before they hit `main`.

## Inputs

- A PR number on `DoctorinaAI/screenshot-viewer`, or the current branch diff vs `main`.

## Process

1. Get the diff:
   - `gh pr diff <N>` for a specific PR.
   - `git diff main...HEAD` for the current branch.
2. For each touched file, read the relevant rule file:
   - `src/**/*.tsx` → [`docs/rules/solidjs.md`](../../../docs/rules/solidjs.md), [`docs/rules/components.md`](../../../docs/rules/components.md), [`docs/rules/typescript.md`](../../../docs/rules/typescript.md), [`docs/rules/tailwind.md`](../../../docs/rules/tailwind.md).
   - `src/**/*.ts` (non-JSX) → [`docs/rules/typescript.md`](../../../docs/rules/typescript.md).
   - `firebase/**` → [`docs/firebase.md`](../../../docs/firebase.md).
   - `docs/**` → [`docs/conventions.md`](../../../docs/conventions.md).
3. Audit against the checklists below.
4. Comment on the PR (or print the report) — be specific: file:line, what's wrong, what to change.

## Checklist — TSX

- [ ] Props are never destructured. Reads use `props.X` or `splitProps`.
- [ ] No ternaries-with-JSX or `.map()` for control flow — `<Show>` / `<For>` / `<Switch>` instead.
- [ ] No `useEffect` — `createEffect`, `onMount`, `onCleanup`.
- [ ] No `any`. `unknown` at boundaries, narrowed with Zod or predicates.
- [ ] No TS enums — `as const` objects.
- [ ] File name is kebab-case.
- [ ] Named exports (or `export default` in `src/pages/`).
- [ ] Component accepts `class` and merges via `cn()`.
- [ ] Spreads `{...rest}` from `splitProps`, not the whole `props`.
- [ ] Variants via CVA, not inline string conditionals.
- [ ] Mobile-first responsive — base styles work at 360 px.
- [ ] No raw hex colours — theme tokens only.

## Checklist — TS (non-TSX)

- [ ] No `any`. No TS enums.
- [ ] `import type` for type-only imports.
- [ ] `@/` alias for absolute imports.
- [ ] Boundary inputs are `unknown` until narrowed (preferably with Zod).

## Checklist — Firebase / rules

- [ ] Rules diff doesn't widen read access beyond `@doctorina.com`.
- [ ] No `allow read, write: if true` anywhere.
- [ ] Index changes are mirrored in `firestore.indexes.json` (run `firebase firestore:indexes` to confirm).
- [ ] CORS additions reference the actual viewer Hosting URL, not wildcards.

## Checklist — docs

- [ ] Concrete, current, no stale references (run IDs, commit SHAs).
- [ ] Links use repo-relative paths.
- [ ] Decisions are dated when they're time-sensitive (e.g., "as of YYYY-MM-DD").

## Output format

Group findings by severity, then file. Example:

```
## Blocking
- src/features/runs/api.ts:42 — `any` on the Firestore doc handler. Use `RunDocSchema.parse(doc.data())`.
- src/shared/ui/badge.tsx:18 — destructured `props`. Switch to `splitProps`.

## Suggestions
- src/pages/landing.tsx:60 — grid breakpoints missing `sm:`; phones get a 4-col grid.

## Looks good
- Schema additions in docs/manifest-schema.md align with the writer at scripts/upload_integration_screenshots.py.
```

If the diff is small and clean, say so explicitly. Don't manufacture findings to look thorough.
