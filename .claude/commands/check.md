---
description: Run the project's quality gates — Biome (lint + format), tsc typecheck, and a production build.
---

Run `bun run check && bun run typecheck && bun run build` from the repo root. Stop and report on the first failure; do not auto-fix without confirmation.

Why this command exists: these three steps are what CI runs. Local pass means the PR is unlikely to be blocked at the gate.
