# Firebase

Project: **`doctorina-test`** (Blaze).

Single Firebase project for everything. Reads happen from the SPA via the Firebase JS SDK; writes happen from CI via the Admin SDK / service account. Client-side writes are denied unconditionally by both rule sets.

## Resources

| Service | Resource | Region | Notes |
|---|---|---|---|
| Firestore | `(default)` | `europe-west1` | Native mode. TTL policy active on `runs.expireAt`. |
| Cloud Storage | `doctorina-test.firebasestorage.app` | `us-east1` | Free-tier (5 GB / 1 GB egress/day). Uniform IAM, public-access prevention "inherited", soft-delete 7 d. |
| Firebase Auth | n/a | global | Google provider enabled. Domain check is enforced in rules, **not** the provider config. |
| Firebase Hosting | `doctorina-test` | global CDN | Site URL: https://doctorina-test.web.app. Deployed automatically by `.github/workflows/firebase-hosting-merge.yaml` on every push to `main`; PR previews via `firebase-hosting-pull-request.yaml`. |

## Auth model

- Sign-in via Google (popup), with `hd=doctorina.com` as a hint to the account picker.
- Rules require `request.auth.token.email_verified == true`, `request.auth.token.email.matches('^[^@]+@doctorina[.]com$')`, and `request.auth.token.firebase.sign_in_provider == 'google.com'`.
- Non-`@doctorina.com` accounts can complete sign-in but **see no data**. The viewer detects this client-side, immediately `signOut()`s, and shows an error toast: "Sign in with a `@doctorina.com` account."

## Rules

Lives in [`firebase/firestore.rules`](../firebase/firestore.rules) and [`firebase/storage.rules`](../firebase/storage.rules). Both follow the same pattern:

```
function isDoctorinaUser() {
  return request.auth != null
    && request.auth.token.email_verified == true
    && request.auth.token.email.matches('^[^@]+@doctorina[.]com$')
    && request.auth.token.firebase.sign_in_provider == 'google.com';
}

match /runs/...           { allow read: if isDoctorinaUser(); allow write: if false; }
match /<everything else>  { allow read, write: if false; }
```

Writes from CI bypass these rules because the Admin SDK / service account runs with project-level credentials.

## Storage layout

```
gs://doctorina-test.firebasestorage.app/
└── runs/
    └── <commit-sha>/
        ├── manifest.json   ~200–400 KB
        └── images.zip      ~50 MB, ZIP_STORED, dedup by SHA-256
```

- **Lifecycle Rule**: `age > 30 days` with `matchesPrefix: ["runs/"]` → `Delete`. Defined in [`firebase/lifecycle.json`](../firebase/lifecycle.json).
- **CORS**: GET / HEAD from the Hosting URLs + `localhost:5173` / `localhost:5000`. Defined in [`firebase/cors.json`](../firebase/cors.json). Update when a custom Hosting domain is added.
- **TTL drift**: Firestore TTL runs continuously; Storage Lifecycle runs once a day. So a Storage object may outlive its Firestore doc by up to 24 hours. Acceptable — the orphan costs nothing.

## CI credentials

A dedicated service account `screenshot-uploader@doctorina-test.iam.gserviceaccount.com` is used by CI:

- `roles/storage.objectAdmin` on `gs://doctorina-test.firebasestorage.app` (bucket-scoped, not project).
- `roles/datastore.user` on the project (Firestore writes).

JSON key stored in repo secret `DOCTORINA_TEST_SCREENSHOTS_SA_KEY` on `DoctorinaAI/doctorina`. The viewer **never** uses this SA — it talks to Firebase as the signed-in user only.

## Deploy commands

```fish
# Rules + indexes (run from the firebase/ subdirectory)
cd firebase
firebase deploy --only firestore:rules,firestore:indexes,storage --project doctorina-test

# Hosting — manual deploy of the current dist/ build
firebase deploy --only hosting --project doctorina-test

# Bucket-level config (CORS + lifecycle) — needs gcloud
gcloud storage buckets update gs://doctorina-test.firebasestorage.app \
  --cors-file=cors.json --project=doctorina-test
gcloud storage buckets update gs://doctorina-test.firebasestorage.app \
  --lifecycle-file=lifecycle.json --project=doctorina-test

# Firestore TTL — needs gcloud, one-shot setup
gcloud firestore fields ttls update expireAt \
  --collection-group=runs --project=doctorina-test --enable-ttl
```

## Hosting

- **Config**: [`firebase/firebase.json`](../firebase/firebase.json) — site `doctorina-test`, `public: "../dist"`, SPA rewrite (`** → /index.html`), `cleanUrls: true`. Hashed assets (`*.js`/`*.css`/fonts/images) get `Cache-Control: public, max-age=31536000, immutable`; `/index.html` is `no-cache` with security headers (`X-Robots-Tag: noindex`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, restrictive `Permissions-Policy`).
- **Live deploy**: every push to `main` → [`.github/workflows/firebase-hosting-merge.yaml`](../.github/workflows/firebase-hosting-merge.yaml) runs the full gate (`check` / `typecheck` / `test` / `build`) then `firebase deploy --only hosting` via the `FirebaseExtended/action-hosting-deploy@v0` action.
- **PR preview**: every PR → [`.github/workflows/firebase-hosting-pull-request.yaml`](../.github/workflows/firebase-hosting-pull-request.yaml) uploads to a 7-day preview channel; the action posts the URL as a PR comment.

### One-time CI setup

The workflows need:

1. A service account that can deploy to Hosting. Cleanest setup: from the repo root, run
   ```fish
   cd firebase && firebase init hosting:github
   ```
   which creates `github-action-<id>@doctorina-test.iam.gserviceaccount.com` with `roles/firebasehosting.admin` + `roles/firebaseauth.viewer`, downloads its JSON key, and stores it as the repo secret `FIREBASE_SERVICE_ACCOUNT_DOCTORINA_TEST`. Decline the offer to rewrite the workflow files — the ones in `.github/workflows/firebase-hosting-*` are already wired.

2. The six Firebase Web SDK identifiers as **GitHub repo variables** (`vars`) — everything except `apiKey`, which is a **secret**:
   - Variable `VITE_FIREBASE_AUTH_DOMAIN` = `doctorina-test.firebaseapp.com`
   - Variable `VITE_FIREBASE_PROJECT_ID` = `doctorina-test`
   - Variable `VITE_FIREBASE_STORAGE_BUCKET` = `doctorina-test.firebasestorage.app`
   - Variable `VITE_FIREBASE_MESSAGING_SENDER_ID` = `205913150108`
   - Variable `VITE_FIREBASE_APP_ID` = `1:205913150108:web:37d1938e2c28d8c2dad359`
   - Secret `VITE_FIREBASE_API_KEY` = the apiKey from `firebase apps:sdkconfig WEB ... --project doctorina-test`

These are public Web SDK identifiers (security lives in `firestore.rules` + `storage.rules`), but treating `apiKey` as a secret matches what `firebase init hosting:github` does and keeps it from showing up in workflow run logs.

## SDK init

Implemented in [`src/shared/api/firebase.ts`](../src/shared/api/firebase.ts). Reads all six identifiers from `import.meta.env.VITE_FIREBASE_*` (Vite build-time env). Throws at runtime with a clear message if any value is blank — the message lists which keys are missing and points at `firebase apps:sdkconfig WEB`.

Local dev: copy `.env.example` to `.env.local` and paste the apiKey from `firebase apps:sdkconfig WEB 1:205913150108:web:37d1938e2c28d8c2dad359 --project doctorina-test`. CI builds get the same values from repo variables + the `VITE_FIREBASE_API_KEY` secret (see Hosting → One-time CI setup above).
