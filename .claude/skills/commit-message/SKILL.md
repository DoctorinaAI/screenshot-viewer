---
name: commit-message
description: Write a git commit message for the screenshot-viewer following Conventional Commits with this repo's scopes. Use when the user asks to commit, create a commit, or write a commit message.
---

# Commit Message

Follow [Conventional Commits](https://www.conventionalcommits.org/) with the scopes used in this repo.

## Format

```
<type>(<scope>): <subject>

<body — optional, wraps at 72 chars, explains the why>
```

## Types

`feat`, `fix`, `refactor`, `docs`, `chore`, `test`, `perf`, `style`, `build`, `ci`.

## Scopes (use when obvious)

- `ui` — anything in `src/shared/ui/`.
- `auth` — Firebase Auth flow and guard.
- `runs` — landing page, run-list feature.
- `run` — single-run page (`/runs/:id`).
- `firebase` — `firebase/` config or `src/shared/api/firebase.ts`.
- `schema` — `src/shared/lib/schema.ts` or `docs/manifest-schema.md`.
- `docs` — files under `docs/` or top-level markdown.
- `claude` — `.claude/` config, skills, hooks.
- `deps` — `package.json` / `bun.lock` updates.
- `ci` — `.github/workflows/`.

## Rules

- **Subject**: imperative mood, lowercase, no trailing period, ≤ 72 chars. Example: `feat(ui): add badge component with status variants`.
- **Body** (optional): explains the **why**, not the what. Wrap at 72.
- **No "🤖 Generated with Claude Code" footer.** **No `Co-Authored-By: Claude` trailer.** This is a hard rule for this user — they will revert commits that contain either.
- For multi-task scopes, prefer one commit per logical unit. Avoid catch-all "various improvements" commits.

## Examples

```
feat(ui): add Button component with default/destructive/outline/ghost variants

CVA-driven variants, splitProps for class merging, Kobalte-free
(plain button — Kobalte is overkill here). Tracks the Milestone 1
component checklist in DESIGN.md.
```

```
fix(auth): sign out users whose token is missing the @doctorina.com claim

Previously the guard let the app render briefly before Firestore
rules denied the read, which produced a confusing error toast. Now
we check the token claim directly and signOut() before the route
mounts.
```

```
chore(deps): bump @kobalte/core to 0.13.12

Patch release; no API changes. Picked up because the previous version
warned on focus-trap teardown in dialogs that re-mount their content.
```

## When you should NOT commit

- If `bun run check` or `bun run typecheck` fails — fix the root cause.
- If the staged changes include both a refactor and a feature — split them.
- If you can't write a meaningful subject in under 72 chars — the change is too broad.
