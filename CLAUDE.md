# Doctorina Screenshot Viewer — Claude Code

This repo is pre-configured for Claude Code. Read [`AGENTS.md`](AGENTS.md) for the project overview and hard rules, then the rule files in [`docs/rules/`](docs/rules/) before writing code.

## Stack

TypeScript (strict), SolidJS, Kobalte (UI primitives), Tailwind CSS v4, CVA (variants), Vite, Biome, bun. Firebase JS SDK (Auth + Firestore + Storage). Zod for runtime validation. fflate for client-side zip extraction.

## Where things live

```
.claude/
  settings.json          shared permissions, deny-list
  commands/              project slash commands
  skills/                project skills, auto-loaded when a task matches a skill description
  hooks/stop-reminder.sh check-list shown when a turn touched src/

src/
  app/                   Router, providers, auth guard, layouts
  features/              Feature modules — each has api.ts, types.ts, store.ts (optional), components/
  pages/                 Route entry points (lazy-loaded, default exports)
  shared/
    api/                 Firebase clients (auth, firestore, storage)
    lib/                 cn(), Zod schemas, zip helpers, formatters
    ui/                  shadcn-style components — Build from these, not raw HTML

docs/
  rules/                 LLM rules — read before writing
  architecture.md        Big picture, data flow
  manifest-schema.md     RunDoc + Manifest TS types and Zod schemas (single source of truth)
  ui-kit.md              Component library principles
  firebase.md            Auth + rules + bucket layout
  conventions.md         Naming, file structure, imports

firebase/                Firestore + Storage rules, indexes, CORS, lifecycle
```

## Hard rules (one-line each)

- Never destructure props — breaks SolidJS reactivity.
- Use `<Show>`, `<For>`, `<Switch>/<Match>` — never ternaries-with-JSX or `.map()` in templates.
- No `useEffect` — use `createEffect`, `onMount`, `onCleanup`.
- No `any`. No TS enums. File names kebab-case. Named exports (except `pages/`).
- Build the UI from `src/shared/ui/*` components. **Design system first.**
- Every layout responsive (mobile-first Tailwind).
- Validate every Firestore doc and Storage payload with Zod.
- Auth guard at the router level. No data fetch for unauthorized users.

## Slash commands

| Command | Action |
|---|---|
| `/check` | `bun run check && bun run typecheck && bun run build` |
| `/deploy-firebase` | `firebase deploy --only firestore:rules,firestore:indexes,storage --project doctorina-test` |

## Skills

Auto-loaded when the task matches. Manual invocation: `/<skill-name>`.

- `commit-message` — Conventional Commits in this repo's style (no Claude Code signature).
- `add-solid-component` — Create or modify a SolidJS component with all the rules above.
- `review-pr` — Review a PR (or current branch) against the rule files.
- `verify-changes` — Walk the touched UI in Playwright (via MCP) before claiming done.

## MCP

- **playwright** — UI verification after `bun run dev`.

## Things that are NOT here

- Backend. There is no server; the SPA talks directly to Firebase.
- CI for screenshot capture. That lives in [`DoctorinaAI/doctorina`](https://github.com/DoctorinaAI/doctorina) — this repo never touches the test code.
- Cloud Functions. Spark-tier Firebase doesn't allow them, and Blaze still doesn't need them for this workload.
