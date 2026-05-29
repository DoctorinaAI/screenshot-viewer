# Architecture

## Big picture

```
DoctorinaAI/doctorina (GitHub Actions, self-hosted macOS)
        │
        │  flutter test → screenshots/*.png + cases.jsonl + shots.jsonl
        │  cwebp → screenshots/*.webp
        │  uv run scripts/upload_integration_screenshots.py
        │      ├── build manifest.json (dedup by SHA-256, denormalized dicts)
        │      └── zip unique images → images.zip
        │
        ▼
Firebase project `doctorina-test`
  ├── Cloud Storage  gs://doctorina-test.firebasestorage.app
  │     └── runs/<commit-sha>/
  │           ├── manifest.json   ~200–400 KB
  │           └── images.zip      ~50 MB typical
  └── Firestore  (default) europe-west1
        └── runs/<runId>           ~2 KB RunDoc, TTL = createdAt + 30d

        ▲
        │  Firebase JS SDK (Auth + Firestore + Storage)
        │  fflate for client-side zip extraction
        │
DoctorinaAI/screenshot-viewer  (Firebase Hosting in `doctorina-test`)
```

## Data flow

### Landing page

1. Auth guard waits for `user()` non-null + verified `@doctorina.com` email.
2. Firestore query: `collection('runs').orderBy('createdAt', 'desc').limit(30)` plus active filter clauses.
3. Each card renders **purely from the Firestore doc**. No Storage access here — every Storage download costs the daily egress budget.
4. Filter changes trigger a new Firestore query; results may share the cache across views.
5. Pagination via `startAfter(lastDoc)` on intersection of the bottom sentinel.

### Run page

1. Card click navigates to `/runs/:runId`. Auth guard re-checks.
2. Fetch `manifestPath` (from RunDoc) → download `manifest.json` → validate with Zod → store in a Solid resource. **The entire run is now in memory.**
3. Grouping / filtering happens client-side over the parsed manifest. No further Firestore reads.
4. Image tiles render placeholders (status badge, case id, language) until the zip is loaded.
5. On first scroll / intent, fetch `imagesPath` (from RunDoc) → `fflate.unzipSync` → keep `Map<hash, Blob>` → tiles swap to `URL.createObjectURL(blob)`.
6. Lightbox / fullscreen uses the same blob URLs; no re-fetch.

### Auth flow

1. App boots → `getRedirectResult` / `onAuthStateChanged` resolve the current user.
2. If signed-in and `email_verified && /@doctorina\.com$/`: app renders.
3. Otherwise: `<Navigate>` to `/login`, which shows a single "Sign in with Google" button.
4. Sign-in via `signInWithPopup(provider)`; provider hints `hd=doctorina.com` to bias Google's account picker.
5. Post-sign-in, the same domain check runs. If it fails: `signOut()` and show an error toast — "Sign in with a `@doctorina.com` account."

## Routes

| Path | Page | Auth |
|---|---|---|
| `/login` | `login.tsx` | public |
| `/` | `landing.tsx` | required |
| `/runs/:runId` | `run.tsx` | required |
| `/ui-kit` | `ui-kit.tsx` | required (matches foxic — internal use) |

## State

- **No global store.** Each feature owns its state through `createResource` and `createSignal`.
- **AuthProvider** is the only context, exposing `user()`, `loading()`, `signIn()`, `signOut()`.
- Firestore data goes through resources so refetch / suspense work out of the box.
- Storage downloads are kept in a per-page `Map<hash, Blob>` that's released on route exit (`onCleanup`).

## What is intentionally absent

- **No Cloud Functions.** The original design was Spark-tier; Blaze allows them but we don't need any for this workload — all derivations (manifest, dedup, zip) happen in CI.
- **No service worker for image bytes.** The 50 MB archive is downloaded eagerly only when the user opens a run, and held in memory for the visit. Pre-caching across visits would balloon storage with little benefit.
- **No cross-run image dedup.** Each archive is self-contained; same bytes in run #5 and run #10 are stored twice. Simpler ops, predictable Storage costs.
- **No preview thumbnails.** Considered (Storage object vs inline base64 in Firestore doc) but dropped — a single hero shot looks identical across runs and adds no information.

## Budgets to respect

Storage egress is the real bottleneck (Blaze free-tier in `us-east1`: 1 GB / day). Practical implications:

- Don't trigger artifact uploads on every PR commit. We use `workflow_dispatch` + labeled PRs + `push` to `develop` filtered by `frontend/**`.
- 20+ run-page opens per day is borderline; cache the unzipped images in memory aggressively during the visit.
- Firestore reads (50 000 / day) are not a real concern: ~30 reads per landing view = 1 600 views / day.
