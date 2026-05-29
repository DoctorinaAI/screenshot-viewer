# Schemas — RunDoc and Manifest

Single source of truth: this file and the corresponding Zod schemas in `src/shared/lib/schema.ts` (when implemented). The Python writer is `scripts/upload_integration_screenshots.py` in [`DoctorinaAI/doctorina`](https://github.com/DoctorinaAI/doctorina). Bump `schemaVersion` in lockstep on both sides.

## RunDoc — Firestore `runs/{runId}`

~2 KB per doc. Stores only fields needed to render landing cards or filter/sort the run list. Detailed metadata lives in `manifest.json`.

```typescript
export const RunStatus = {
  Success: "success",
  Partial: "partial",
  Failed: "failed",
} as const;
export type RunStatus = (typeof RunStatus)[keyof typeof RunStatus];

export const WorkflowTrigger = {
  Push: "push",
  PullRequest: "pull_request",
  WorkflowDispatch: "workflow_dispatch",
  Schedule: "schedule",
} as const;
export type WorkflowTrigger = (typeof WorkflowTrigger)[keyof typeof WorkflowTrigger];

export const AppEnvironment = {
  Development: "development",
  Staging: "staging",
  Production: "production",
  Fake: "fake",
} as const;
export type AppEnvironment = (typeof AppEnvironment)[keyof typeof AppEnvironment];

export interface RunDoc {
  // Identity & lifecycle
  runId: string;                   // e.g. "26635914236-1" — workflow_run_id + attempt
  createdAt: Timestamp;            // orderBy DESC on landing
  expireAt: Timestamp;             // TTL: createdAt + 30 days, Firestore deletes automatically

  // Git context
  git: {
    branch: string;
    commitSha: string;
    commitShaShort: string;
    commitSubject: string;         // first line of commit message, ≤120 chars
    author: { name: string; email: string; avatarUrl?: string };
    tag?: string;
  };

  // Pull request — only when trigger === "pull_request"
  pr?: {
    number: number;
    title: string;
    author: string;
    baseBranch: string;
    url: string;
  };

  // Workflow context
  workflow: {
    trigger: WorkflowTrigger;
    runUrl: string;
    actor: string;
    status: RunStatus;
    durationSec: number;
  };

  // App / build
  app: {
    version: string;               // "1.42.0+1234"
    environment: AppEnvironment;
    flutterVersion: string;
  };

  // Optional issue link, parsed from commit/PR body
  relatedIssue?: { number: number; title: string; url: string };

  // Stats for the card
  stats: {
    totalShots: number;
    uniqueImages: number;
    casesCount: number;
    failedCount: number;
  };

  // Tag arrays — used by array-contains filters
  languages: string[];             // ["en", "ru", "ja", ...]
  layouts: string[];               // ["phone-portrait", ...]
  platforms: string[];             // ["ios", "android", "web", "macos"]
  themes: string[];                // ["light", "dark"]

  // Pointers to Storage
  manifestPath: string;            // "gs://<bucket>/runs/<sha>/manifest.json"
  imagesPath: string;              // "gs://<bucket>/runs/<sha>/images.zip"
  imagesSize: number;              // bytes
}
```

### Composite indexes

Already deployed via `firebase/firestore.indexes.json`:

| Index | Use case |
|---|---|
| `(git.branch ASC, createdAt DESC)` | "Runs on branch X" |
| `(workflow.trigger ASC, createdAt DESC)` | "PR runs only" |
| `(workflow.status ASC, createdAt DESC)` | "Failed runs this week" |
| `(app.version ASC, createdAt DESC)` | "Release 1.42 history" |
| `(git.author.email ASC, createdAt DESC)` | "My runs" |
| `(languages array-contains, createdAt DESC)` | "Runs covering Japanese" |

## Manifest — Storage `runs/<sha>/manifest.json`

~200–400 KB per run. Self-contained: full git / workflow / app context plus normalized dictionaries.

**Denormalization trick:** case descriptions, layout names, and language metadata are stored once each in top-level dictionaries; shots reference them by id. Without this, a typical run balloons to several MB.

```typescript
export const ShotStatus = {
  Ok: "ok",
  Warning: "warning",
  Failed: "failed",
} as const;
export type ShotStatus = (typeof ShotStatus)[keyof typeof ShotStatus];

export const ImageFormat = {
  Png: "png",
  Webp: "webp",
} as const;
export type ImageFormat = (typeof ImageFormat)[keyof typeof ImageFormat];

export const TextDirection = {
  Ltr: "ltr",
  Rtl: "rtl",
} as const;
export type TextDirection = (typeof TextDirection)[keyof typeof TextDirection];

export const Theme = {
  Light: "light",
  Dark: "dark",
  System: "system",
} as const;
export type Theme = (typeof Theme)[keyof typeof Theme];

export const Platform = {
  Ios: "ios",
  Android: "android",
  Web: "web",
  Macos: "macos",
  Linux: "linux",
  Windows: "windows",
} as const;
export type Platform = (typeof Platform)[keyof typeof Platform];

export interface Manifest {
  schemaVersion: 1;
  runId: string;
  createdAt: string;               // ISO 8601

  git: {
    repository: { owner: string; name: string; url: string };
    branch: string;
    commit: {
      sha: string; shaShort: string;
      subject: string; body: string;
      author: { name: string; email: string; date: string };
      committer: { name: string; email: string; date: string };
    };
    tag?: string;
    baseSha?: string;
  };

  pr?: {
    number: number; title: string; body: string;
    author: string; baseBranch: string; headBranch: string;
    url: string; labels: string[];
  };

  workflow: {
    trigger: WorkflowTrigger;
    runId: string; runUrl: string; runAttempt: number;
    actor: string; event: string; ref: string;
    startedAt: string; completedAt: string; durationSec: number;
    runner: { os: string; arch: string; image: string };
  };

  app: {
    name: string;
    version: string;
    buildNumber: number;
    flavor: string;
    environment: AppEnvironment;
    flutterVersion: string;
    dartVersion: string;
    dependencies?: Record<string, string>;
  };

  relatedIssues?: Array<{ number: number; title: string; url: string }>;

  // Dictionaries — each description stored once
  cases: Array<{
    id: string;                    // "auth/login/empty_form"
    title: string;
    description: string;
    feature: string;
    tags: string[];
    sourceFile?: string;           // "test/cases/auth_login_test.dart:42"
  }>;

  layouts: Array<{
    id: string;
    name: string;
    deviceModel?: string;
    width: number; height: number; dpr: number;
    orientation: "portrait" | "landscape";
  }>;

  languages: Array<{
    code: string;
    name: string;
    direction: TextDirection;
  }>;

  images: Array<{                  // deduplicated by hash
    hash: string;                  // sha256 hex
    filename: string;              // "images/<hash>.<ext>" — path inside zip
    width: number; height: number;
    bytes: number;
    format: ImageFormat;
  }>;

  // Shots — compact references into the dictionaries above
  shots: Array<{
    id: string;
    caseId: string;                // → cases[]
    layoutId: string;              // → layouts[]
    languageCode: string;          // → languages[]
    theme: Theme;
    platform: Platform;
    imageHash: string;             // → images[]
    capturedAt: string;            // ISO 8601
    renderDurationMs?: number;
    status: ShotStatus;
    warnings?: string[];
    annotations?: Record<string, unknown>;
  }>;

  stats: {
    totalShots: number;
    uniqueImages: number;
    failedShots: number;
    bytesTotal: number;
    bytesDedupSaved: number;
  };
}
```

## Validation rules

- Parse every Firestore doc with Zod before rendering. Drop or surface the malformed doc loudly — do not silently fall back to defaults.
- Parse the `manifest.json` with Zod immediately after download. If validation fails, surface "Manifest schema mismatch — does the writer need an update?" and stop. Never partial-render.
- Cross-reference checks (defensive — should never fail in practice):
  - Every `shot.caseId` resolves to a `cases[i].id`.
  - Every `shot.layoutId` resolves to a `layouts[i].id`.
  - Every `shot.languageCode` resolves to a `languages[i].code`.
  - Every `shot.imageHash` resolves to an `images[i].hash`.

## Versioning

- `schemaVersion: 1` today. Bump when a non-backward-compatible field changes.
- On a bump, the viewer should refuse to render older runs with a clear message rather than guess.
- TTL is 30 days, so a `schemaVersion` change is fully out of the system in 30 days; we don't need long-term migration tooling.
