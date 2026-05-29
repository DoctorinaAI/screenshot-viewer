# Roadmap

Living document. Update as work lands.

## Done (cloud + CI, as of 2026-05-29)

- Firebase project `doctorina-test` on Blaze.
- Firestore `(default)` in `europe-west1`, TTL policy on `runs.expireAt` (+30 days).
- Storage bucket `doctorina-test.firebasestorage.app` in `us-east1` (free-tier 5 GB storage / 1 GB egress per day), uniform IAM, public-access prevention, CORS allow-list, lifecycle rule deleting `runs/*` after 30 days.
- Composite indexes on `runs/`: by `git.branch`, `workflow.trigger`, `workflow.status`, `app.version`, `git.author.email`, `languages` — each combined with `createdAt DESC`. Source of truth: `firebase/firestore.indexes.json`.
- Security rules — Firestore + Storage both gate reads on `request.auth.token.email_verified == true` and `email matches '.*@doctorina[.]com$'`. Writes are CI-only via the Admin SDK / service account, which bypasses rules.
- Firebase Auth — Google provider enabled.
- Dedicated CI service account `screenshot-uploader@doctorina-test.iam.gserviceaccount.com` with `roles/storage.objectAdmin` (bucket-scoped) + `roles/datastore.user`. JSON key stored in repo secret `DOCTORINA_TEST_SCREENSHOTS_SA_KEY` on `DoctorinaAI/doctorina`.
- CI workflow `.github/workflows/frontend-integration-tests-selfhosted.yaml` in `DoctorinaAI/doctorina` is fully wired:
  - Runs on `workflow_dispatch`, on PRs labeled `screenshots`, and on `push` to `develop` filtered by `frontend/**`.
  - Builds `manifest.json` (deduped by SHA-256) + `images.zip` via `scripts/upload_integration_screenshots.py` (PEP 723, pinned uv via `astral-sh/setup-uv@v6`).
  - Uploads to `gs://doctorina-test.firebasestorage.app/runs/<sha>/` and writes the RunDoc to `runs/<workflow_run_id>-<attempt>`.
- End-to-end CI smoke verified: [run 26635914236](https://github.com/DoctorinaAI/doctorina/actions/runs/26635914236) — 96 shots × 4 layouts × 3 languages × 1 theme.

## Open decisions (resolved 2026-05-29)

| Question | Decision |
|---|---|
| `runId` | `${GITHUB_RUN_ID}-${GITHUB_RUN_ATTEMPT}`. |
| CI trigger | `workflow_dispatch` + labeled PR + push to `develop` × `frontend/**`. |
| Auth model | Firebase Auth + Google Sign-In + `@doctorina.com` domain check in rules. |
| Failed shots | Upload every captured image; per-shot `status` is `'ok' \| 'warning' \| 'failed'`. |

## Next (the viewer SPA)

Tracked in order. Each item is roughly one PR.

### 1. Design system — **first thing we do**

- Tailwind theme: colors, typography scale, spacing.
- Port the shadcn-style primitives from foxic into `src/shared/ui/`: button, badge, card, input, select, dialog, dropdown-menu, popover, tooltip, table, tabs, separator, skeleton, switch, checkbox.
- `src/shared/lib/cn.ts` (clsx + tailwind-merge).
- `src/index.css` with Tailwind v4 directives + theme tokens.
- UI Kit showcase route (`/ui-kit`) listing each primitive.

### 2. Schema + data layer

- `src/shared/lib/schema.ts` — Zod schemas for `RunDoc` and `Manifest` (source: `docs/manifest-schema.md`).
- `src/shared/api/firebase.ts` — initialize app from build-time config.
- `src/shared/api/auth.ts` — Firebase Auth provider + sign-in/out helpers + `@doctorina.com` guard.
- `src/shared/api/runs.ts` — Firestore query helpers (paginated `orderBy createdAt DESC` + filters).
- `src/shared/api/storage.ts` — Storage download helpers for `manifest.json` + lazy `images.zip` via fflate.

### 3. Auth flow + router

- `<AuthProvider>` resource around the app, exposing `user()`, `loading()`, `signIn()`, `signOut()`.
- Router with `<ProtectedRoute>` that blocks navigation until `user()` is non-null and domain-valid.
- Login page: branded sign-in screen, single Google button, error states for non-`@doctorina.com` emails.

### 4. Landing page

- Run cards: branch chip, status pill, commit subject, author avatar, app version, languages summary, totals, age.
- Filter bar: branch, trigger, status, language, app version, author. Each maps to a Firestore composite index.
- Pagination — limit 30, infinite scroll on intersect.
- Empty state, error state, skeleton loaders.

### 5. Run page

- Top: run header (commit, branch, author, run URL, totals).
- Sidebar: grouping selector (by case / by language / by layout) + filter chips.
- Grid: deduped images, lazy fetch + unzip on viewport intersection. Click → fullscreen viewer.
- "What changed" mode: highlight `(case, layout)` groups that resolve to multiple `imageHash` values.

### 6. Hosting deploy

- Add a Hosting target in `firebase.json` pointing to `dist/`.
- GitHub Actions workflow (`.github/workflows/deploy-hosting.yaml`) on push to `main`.
- Wire CSP, cache headers for hashed assets.

### 7. Polish

- PWA shell + offline manifest cache.
- Keyboard navigation (Kobalte covers most of it for free).
- Lightbox-style image viewer with `<-`/`->` and `1`/`2` for side-by-side diff.

## Not now

- Cross-run image dedup. Each archive is self-contained.
- Server-side image processing. No Cloud Functions.
- Run preview thumbnails. Considered and dropped — every card would have shown the same hero shot.
- Golden-master diffing. Future, when the Flutter side produces expected vs. actual pairs.
