# Firebase

Project: **`doctorina-test`** (Blaze).

Single Firebase project for everything. Reads happen from the SPA via the Firebase JS SDK; writes happen from CI via the Admin SDK / service account. Client-side writes are denied unconditionally by both rule sets.

## Resources

| Service | Resource | Region | Notes |
|---|---|---|---|
| Firestore | `(default)` | `europe-west1` | Native mode. TTL policy active on `runs.expireAt`. |
| Cloud Storage | `doctorina-test.firebasestorage.app` | `us-east1` | Free-tier (5 GB / 1 GB egress/day). Uniform IAM, public-access prevention "inherited", soft-delete 7 d. |
| Firebase Auth | n/a | global | Google provider enabled. Domain check is enforced in rules, **not** the provider config. |
| Firebase Hosting | `doctorina-test` (to be added) | europe-west1 | Wired in [Hosting milestone](../ROADMAP.md). |

## Auth model

- Sign-in via Google (popup), with `hd=doctorina.com` as a hint to the account picker.
- Rules require `request.auth.token.email_verified == true` and `request.auth.token.email.matches('.*@doctorina[.]com$')`.
- Non-`@doctorina.com` accounts can complete sign-in but **see no data**. The viewer detects this client-side, immediately `signOut()`s, and shows an error toast: "Sign in with a `@doctorina.com` account."

## Rules

Lives in [`firebase/firestore.rules`](../firebase/firestore.rules) and [`firebase/storage.rules`](../firebase/storage.rules). Both follow the same pattern:

```
function isDoctorinaUser() {
  return request.auth != null
    && request.auth.token.email_verified == true
    && request.auth.token.email.matches('.*@doctorina[.]com$');
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

# Bucket-level config (CORS + lifecycle) — needs gcloud
gcloud storage buckets update gs://doctorina-test.firebasestorage.app \
  --cors-file=cors.json --project=doctorina-test
gcloud storage buckets update gs://doctorina-test.firebasestorage.app \
  --lifecycle-file=lifecycle.json --project=doctorina-test

# Firestore TTL — needs gcloud, one-shot setup
gcloud firestore fields ttls update expireAt \
  --collection-group=runs --project=doctorina-test --enable-ttl
```

## SDK init (sketch — implementation pending)

```typescript
// src/shared/api/firebase.ts
import { initializeApp } from "firebase/app";

const app = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "doctorina-test.firebaseapp.com",
  projectId: "doctorina-test",
  storageBucket: "doctorina-test.firebasestorage.app",
  messagingSenderId: "205913150108",
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
});

export { app };
```

Firebase API key + app ID come from `Doctorina` web app already registered in `doctorina-test` (see `firebase apps:list --project doctorina-test`). Surface them via `.env.local` (gitignored) and `VITE_*` env vars; build-time injection is fine since these are public-by-design values.
