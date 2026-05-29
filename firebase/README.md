# Screenshot viewer — Firebase infrastructure

Firebase project: **`doctorina-test`** (region `europe-west1`).

Stores Flutter integration-test screenshot artifacts and serves the viewer SPA. See [DoctorinaAI/doctorina#3695](https://github.com/DoctorinaAI/doctorina/issues/3695) for the full design.

## Files

| File | Purpose |
|---|---|
| `firebase.json` | Firebase CLI config — points to local `firestore.rules`, `firestore.indexes.json`, `storage.rules`. |
| `.firebaserc` | Default project alias (`doctorina-test`). |
| `firestore.rules` | Read = Firebase Auth + verified `@doctorina.com` email; writes denied (CI uses Admin SDK / bypasses rules). |
| `firestore.indexes.json` | Composite indexes for landing-page filters (branch, trigger, status, version, author, languages). |
| `storage.rules` | Same auth model as Firestore for `runs/**`. |
| `cors.json` | Bucket CORS allow-list (Hosting URLs + localhost). Apply with `gcloud storage`. |
| `lifecycle.json` | Storage lifecycle: delete `runs/*` after 30 days. Apply with `gcloud storage`. |

## Deploy

```bash
# From this directory:
firebase deploy --only firestore:rules,firestore:indexes,storage --project doctorina-test
```

## Apply bucket-level config (requires gcloud)

```bash
BUCKET=gs://doctorina-test.firebasestorage.app

gcloud storage buckets update "$BUCKET" --cors-file=cors.json
gcloud storage buckets update "$BUCKET" --lifecycle-file=lifecycle.json
```

## Firestore TTL on `runs.expireAt` (requires gcloud)

```bash
gcloud firestore fields ttls update expireAt \
  --collection-group=runs \
  --project=doctorina-test \
  --enable-ttl
```
