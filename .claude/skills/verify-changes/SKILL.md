---
name: verify-changes
description: Verify UI changes in the screenshot-viewer by walking the touched flow in Playwright (via MCP) at multiple breakpoints, in light and dark themes. Use after editing any .tsx file in src/, before claiming a task complete.
---

# Verify Changes

The repo runs `bun run check && bun run typecheck` in CI — those gate **code correctness**, not **feature correctness**. Visual walk is the only way to catch broken layouts, hover states, focus rings, and dark-mode regressions.

## When to run this

- After any change in `src/`.
- After bumping a dependency that affects rendering (Kobalte, Tailwind, Solid).
- Before opening a PR that touches UI.

## Process

1. Start the dev server:
   ```fish
   bun run dev
   ```
   It runs on `http://localhost:5173`.

2. Walk the touched flow via Playwright MCP:
   - `mcp__playwright__browser_navigate` to `http://localhost:5173`.
   - Sign in (or use a stub flag, see below).
   - Navigate through the changed route.
   - `mcp__playwright__browser_snapshot` at each step.

3. Walk the breakpoints. For each step in the flow, `mcp__playwright__browser_resize` to:
   - **360 × 800** (phone portrait)
   - **768 × 1024** (tablet)
   - **1280 × 800** (laptop)
   - **1920 × 1080** (desktop)
   And snapshot. Look for: overflow, illegible text, broken grids, hidden interactive elements.

4. Walk light and dark themes. Toggle via the header (or `<html class="dark">` in DevTools). Snapshot both.

5. Walk error / empty / loading states. If your change touches a `<Show>` or `<Switch>`, force each branch:
   - Loading: throttle network or block the Firestore request.
   - Empty: query a filter combination that returns 0 rows.
   - Error: block Storage, see the error path render.

6. Console check: `mcp__playwright__browser_console_messages`. Any new errors or warnings? Especially:
   - Hydration mismatches.
   - `Cannot read property of undefined` from missing optional chains.
   - Firebase rule denials (would mean the auth guard let an unauthorized view through).

## Auth bypass for local development

Signing in with a real Google account each time is friction. Two options:

- **Real sign-in once per session.** Auth state persists across navigations via Firebase Auth's local persistence.
- **Stub mode.** Set `VITE_AUTH_STUB=mikhail.matiunin@doctorina.com` in `.env.local`. The `<AuthProvider>` short-circuits to a fake user with that email when this var is set (only in dev — Vite strips it in production builds). Not yet implemented; add when the auth flow lands.

## What "verified" means

- [ ] Each touched route renders cleanly at all four breakpoints.
- [ ] Light + dark themes both look correct.
- [ ] No new console errors / warnings.
- [ ] Loading / empty / error states each render without layout shifts.
- [ ] Keyboard navigation works (Tab through the page; focus rings visible).
- [ ] No layout depends on JavaScript being faster than the user (avoid "flash of wrong content").

If you cannot run Playwright (no browser, env issue), say so explicitly in the PR description. Do not claim verification you didn't perform.
