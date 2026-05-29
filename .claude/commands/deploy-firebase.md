---
description: Deploy Firestore rules + indexes and Storage rules to the doctorina-test project. Does not touch Hosting.
---

From the `firebase/` subdirectory:

```fish
firebase deploy --only firestore:rules,firestore:indexes,storage --project doctorina-test
```

Confirm with the user before running. This pushes rule changes that take effect for every reader immediately — there is no canary.

Bucket-level config (CORS, lifecycle) and Firestore TTL require `gcloud` and live in `firebase/README.md`. They are stable; you almost never need to re-run them.
