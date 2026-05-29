# Doctorina — Screenshot Viewer

TypeScript SPA that views Flutter integration-test screenshot artifacts produced by [`DoctorinaAI/doctorina`](https://github.com/DoctorinaAI/doctorina).

Backed by Firebase project **`doctorina-test`** (Blaze): Firestore for the run index, Cloud Storage for per-run `manifest.json` + `images.zip`, Firebase Hosting for the SPA, Firebase Auth (Google Sign-In, `@doctorina.com` only) for access control.

Full design: [`DoctorinaAI/doctorina#3695`](https://github.com/DoctorinaAI/doctorina/issues/3695).

## Stack

TypeScript (strict) · **SolidJS** · **Kobalte** (UI primitives) · **Tailwind CSS v4** · **CVA** (variants) · Vite · Biome · bun · **Zod** (runtime manifest validation) · **fflate** (client-side zip extraction) · Firebase JS SDK (Auth + Firestore + Storage).

Mirrors the conventions from [`foxic`](https://github.com/plugfox/foxic/tree/main/client). Pattern: shadcn-style components in `src/shared/ui/`, feature modules in `src/features/`.

## Repository layout

```
firebase/          Firebase project config (rules, indexes, lifecycle, CORS)
docs/              LLM-facing rules, architecture, schema, UI kit conventions
.claude/           Claude Code config: skills, slash commands, settings
src/               SPA source
  app/             Router, providers, layouts, auth guard
  features/        Feature modules (auth, runs, shots)
  pages/           Route entry points (lazy-loaded)
  shared/
    api/           Firebase clients (auth, firestore, storage)
    lib/           cn(), zip extraction, format helpers, zod schemas
    ui/            Component library (shadcn-style)
```

## Commands

```fish
bun install                    # install deps
bun run dev                    # vite dev server (http://localhost:5173)
bun run build                  # production build
bun run preview                # serve the built bundle
bun run check                  # biome lint + format check
bun run typecheck              # tsc --noEmit
bun run test                   # vitest run
```

## Firebase

Cloud infra is already provisioned. Re-deploy rules + indexes from `firebase/`:

```fish
firebase deploy --only firestore:rules,firestore:indexes,storage --project doctorina-test
```

See `firebase/README.md` for bucket-level (CORS, lifecycle) and Firestore TTL commands that require `gcloud`.

## Status

This branch bootstraps the project. **The viewer itself is not yet implemented.** See [`ROADMAP.md`](ROADMAP.md) for milestones and current state.
