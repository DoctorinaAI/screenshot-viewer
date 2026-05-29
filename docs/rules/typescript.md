# TypeScript Rules

`tsconfig.app.json` runs in **strict mode** with the following additional flags:

- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `verbatimModuleSyntax: true` (forces explicit `import type`)
- `erasableSyntaxOnly: true` (forbids TS enums and other non-erasable syntax)
- `noFallthroughCasesInSwitch: true`
- `noUncheckedSideEffectImports: true`

## No `any`

Use `unknown` and narrow at the boundary.

```ts
// WRONG
function parse(input: any) { return JSON.parse(input); }

// CORRECT
function parse(input: string): unknown { return JSON.parse(input); }

// Even better — Zod at the boundary
const RunDocSchema = z.object({ /* ... */ });
function parseRun(input: unknown): RunDoc {
  return RunDocSchema.parse(input);
}
```

Boundaries where `unknown` belongs:

- `JSON.parse` output
- Firestore `doc.data()` (until validated)
- `fetch().json()` output
- `localStorage.getItem(...)` (after `JSON.parse`)

## No TS enums

`erasableSyntaxOnly` forbids them. Use `as const` objects instead.

```ts
// WRONG
enum Status { Ok = "ok", Failed = "failed" }

// CORRECT
export const Status = { Ok: "ok", Failed: "failed" } as const;
export type Status = (typeof Status)[keyof typeof Status];
```

Benefits beyond compliance: tree-shakable, plays nicely with `verbatimModuleSyntax`, and the runtime value is just a plain object you can iterate.

## `import type` for type-only imports

```ts
// WRONG — emits an import at runtime
import { type RunDoc, fetchRun } from "@/features/runs/api";

// CORRECT
import type { RunDoc } from "@/features/runs/types";
import { fetchRun } from "@/features/runs/api";
```

If a module exports both values and types, split the imports.

## Branded types when crossing untyped boundaries

```ts
type RunId = string & { readonly __brand: "RunId" };
type Sha = string & { readonly __brand: "Sha" };

function toRunId(s: string): RunId {
  if (!/^\d+-\d+$/.test(s)) throw new Error(`invalid runId: ${s}`);
  return s as RunId;
}

// Now you can't pass a Sha where a RunId is expected — at compile time.
```

Don't over-use this — it costs you readability. Reach for it when two `string` ids could be swapped by accident.

## Prefer `interface` for object shapes, `type` for unions

```ts
interface RunDoc { runId: string; createdAt: Timestamp; /* ... */ }

type WorkflowEvent = "push" | "pull_request" | "workflow_dispatch" | "schedule";
```

Both forms work everywhere, but `interface` gives better error messages and supports declaration merging if we ever need it.

## Narrow with predicates, not casts

```ts
// WRONG
const run = doc.data() as RunDoc;

// CORRECT (boundary parse)
const run = RunDocSchema.parse(doc.data());

// CORRECT (type predicate when Zod is overkill)
function isRunDoc(x: unknown): x is RunDoc {
  return typeof x === "object" && x !== null && "runId" in x && typeof x.runId === "string";
}
```

Avoid `as` except for branded-type construction (above) and `as const` literals.

## Error handling

- No `try { ... } catch (e: any)` — types catches as `unknown` by default.
- Narrow with `instanceof Error` or your own error class.

```ts
try {
  await fetchManifest(url);
} catch (err: unknown) {
  const message = err instanceof Error ? err.message : "unknown error";
  showToast({ tone: "danger", message });
}
```

## Path imports

Always use the `@/` alias.

```ts
// WRONG
import { Button } from "../../shared/ui/button";

// CORRECT
import { Button } from "@/shared/ui/button";
```

Configured in `vite.config.ts` and `tsconfig.app.json`.

## When in doubt

The repo runs `bun run check && bun run typecheck` in CI. If both pass, the code complies with the rules above. If they fail, fix the root cause — don't silence the rule.
