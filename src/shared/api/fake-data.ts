// Static fixture data for the fake backend. Both shapes (RunDoc + Manifest)
// validate against the same Zod schemas the real Firebase code uses, so the
// rest of the app cannot tell the difference. Keep this file pure: no DOM,
// no canvas, no Image construction — those live in fake-storage.ts.

import { Timestamp } from "firebase/firestore";
import {
  AppEnvironment,
  ImageFormat,
  type Manifest,
  Platform,
  type RunDoc,
  RunStatus,
  ShotStatus,
  TextDirection,
  Theme,
  WorkflowTrigger,
} from "@/shared/lib/schema";

const NOW = new Date("2026-06-01T12:00:00Z").getTime();
const HOUR = 60 * 60 * 1000;

const CASES: ReadonlyArray<{ id: string; title: string; description: string }> = [
  { id: "login", title: "Login screen", description: "Email + password + OAuth buttons." },
  { id: "dashboard", title: "Dashboard", description: "Today widgets + appointment list." },
  { id: "profile", title: "Profile settings", description: "Avatar, name, language, theme." },
  {
    id: "prescription",
    title: "Prescription detail",
    description: "Drug info, posology, refill CTA.",
  },
  { id: "calendar", title: "Calendar week", description: "7-day grid with availability slots." },
  { id: "billing", title: "Billing history", description: "Invoice list with status badges." },
];

const LANGUAGES: ReadonlyArray<{ code: string; name: string; direction: "ltr" | "rtl" }> = [
  { code: "en", name: "English", direction: TextDirection.Ltr },
  { code: "ru", name: "Русский", direction: TextDirection.Ltr },
  { code: "es", name: "Español", direction: TextDirection.Ltr },
];

const LAYOUTS: ReadonlyArray<{
  id: string;
  name: string;
  width: number;
  height: number;
  dpr: number;
  orientation: "portrait" | "landscape";
}> = [
  { id: "iphone-15", name: "iPhone 15", width: 393, height: 852, dpr: 3, orientation: "portrait" },
  { id: "pixel-7", name: "Pixel 7", width: 412, height: 915, dpr: 2.6, orientation: "portrait" },
];

interface RunSeed {
  runId: string;
  status: RunStatus;
  trigger: WorkflowTrigger;
  branch: string;
  author: { name: string; email: string };
  commit: { sha: string; subject: string };
  appVersion: string;
  prNumber?: number;
  failedCount?: number;
  // Cases that diverge across languages (so "what changed" filter has something
  // to surface). Each entry pins a specific (caseId, layoutId).
  divergingCases?: ReadonlyArray<string>;
  // Ages relative to NOW, in hours, so the "X minutes / hours / days ago"
  // strings cycle across the list.
  hoursAgo: number;
}

const RUN_SEEDS: ReadonlyArray<RunSeed> = [
  {
    runId: "r-2026-06-01-001",
    status: RunStatus.Success,
    trigger: WorkflowTrigger.Push,
    branch: "main",
    author: { name: "Mike Matiunin", email: "plugfox@doctorina.com" },
    commit: {
      sha: "a1b2c3d4e5f60718293a4b5c6d7e8f9012345678",
      subject: "feat(home): polish run cards",
    },
    appVersion: "1.42.0+2042",
    hoursAgo: 0.25,
  },
  {
    runId: "r-2026-06-01-002",
    status: RunStatus.Partial,
    trigger: WorkflowTrigger.PullRequest,
    branch: "feat/qol-improvements",
    author: { name: "Anna Petrova", email: "anna@doctorina.com" },
    commit: {
      sha: "b2c3d4e5f6071829304a5b6c7d8e9f01234567890",
      subject: "feat(qol): app-bar slots + i18n",
    },
    appVersion: "1.42.0-rc.3+2041",
    prNumber: 12,
    failedCount: 2,
    divergingCases: ["login", "billing"],
    hoursAgo: 1.5,
  },
  {
    runId: "r-2026-05-31-007",
    status: RunStatus.Failed,
    trigger: WorkflowTrigger.PullRequest,
    branch: "fix/calendar-overflow-on-narrow-tablets-please-truncate-me",
    author: { name: "Pavel Sidorov", email: "pavel@doctorina.com" },
    commit: {
      sha: "c3d4e5f60718293a4b5c6d7e8f9012345678abcdef",
      subject: "fix(calendar): clamp slot height at 768px",
    },
    appVersion: "1.42.0-rc.2+2040",
    prNumber: 11,
    failedCount: 8,
    divergingCases: ["calendar"],
    hoursAgo: 18,
  },
  {
    runId: "r-2026-05-31-006",
    status: RunStatus.Success,
    trigger: WorkflowTrigger.Schedule,
    branch: "main",
    author: { name: "CI", email: "ci@doctorina.com" },
    commit: {
      sha: "d4e5f60718293a4b5c6d7e8f9012345678abcdef01",
      subject: "ci: nightly screenshot pass",
    },
    appVersion: "1.42.0+2039",
    hoursAgo: 24,
  },
  {
    runId: "r-2026-05-30-014",
    status: RunStatus.Success,
    trigger: WorkflowTrigger.WorkflowDispatch,
    branch: "release/1.42",
    author: { name: "Maria Lopez", email: "maria@doctorina.com" },
    commit: {
      sha: "e5f60718293a4b5c6d7e8f9012345678abcdef0123",
      subject: "chore: bump version to 1.42.0",
    },
    appVersion: "1.42.0+2038",
    hoursAgo: 38,
  },
  {
    runId: "r-2026-05-30-013",
    status: RunStatus.Partial,
    trigger: WorkflowTrigger.PullRequest,
    branch: "feat/prescription-print-layout",
    author: { name: "Liu Wei", email: "liu@doctorina.com" },
    commit: {
      sha: "f60718293a4b5c6d7e8f9012345678abcdef012345",
      subject: "feat(prescription): print stylesheet",
    },
    appVersion: "1.41.4+2037",
    prNumber: 9,
    failedCount: 1,
    divergingCases: ["prescription"],
    hoursAgo: 45,
  },
  {
    runId: "r-2026-05-29-021",
    status: RunStatus.Success,
    trigger: WorkflowTrigger.Push,
    branch: "main",
    author: { name: "Mike Matiunin", email: "plugfox@doctorina.com" },
    commit: {
      sha: "60718293a4b5c6d7e8f9012345678abcdef0123456",
      subject: "refactor(auth): drop the legacy session shim",
    },
    appVersion: "1.41.4+2036",
    hoursAgo: 60,
  },
  {
    runId: "r-2026-05-28-005",
    status: RunStatus.Failed,
    trigger: WorkflowTrigger.Push,
    branch: "main",
    author: { name: "Tom Schmidt", email: "tom@doctorina.com" },
    commit: { sha: "0718293a4b5c6d7e8f9012345678abcdef01234567", subject: "WIP do not merge" },
    appVersion: "1.41.3+2035",
    failedCount: 17,
    hoursAgo: 78,
  },
];

function commitShort(sha: string): string {
  return sha.slice(0, 7);
}

function ts(ms: number): Timestamp {
  return Timestamp.fromMillis(ms);
}

function buildRunDoc(seed: RunSeed): RunDoc {
  const createdMs = NOW - seed.hoursAgo * HOUR;
  const expireMs = createdMs + 90 * 24 * HOUR;
  const totalShots = CASES.length * LANGUAGES.length * LAYOUTS.length;
  const uniqueImages = totalShots - (seed.divergingCases?.length ?? 0);

  return {
    runId: seed.runId,
    createdAt: ts(createdMs),
    expireAt: ts(expireMs),
    git: {
      branch: seed.branch,
      commitSha: seed.commit.sha,
      commitShaShort: commitShort(seed.commit.sha),
      commitSubject: seed.commit.subject,
      author: {
        name: seed.author.name,
        email: seed.author.email,
        avatarUrl: undefined,
      },
    },
    pr:
      seed.prNumber !== undefined
        ? {
            number: seed.prNumber,
            title: seed.commit.subject,
            author: seed.author.email,
            baseBranch: "main",
            url: `https://github.com/DoctorinaAI/doctorina/pull/${seed.prNumber}`,
          }
        : undefined,
    workflow: {
      trigger: seed.trigger,
      runUrl: `https://github.com/DoctorinaAI/doctorina/actions/runs/${seed.runId}`,
      actor: seed.author.email,
      status: seed.status,
      durationSec: 600 + (seed.failedCount ?? 0) * 8,
    },
    app: {
      version: seed.appVersion,
      environment: AppEnvironment.Fake,
      flutterVersion: "3.27.0",
    },
    stats: {
      totalShots,
      uniqueImages,
      casesCount: CASES.length,
      failedCount: seed.failedCount ?? 0,
    },
    languages: LANGUAGES.map((l) => l.code),
    layouts: LAYOUTS.map((l) => l.id),
    platforms: [Platform.Ios, Platform.Android],
    themes: [Theme.Light, Theme.Dark],
    manifestPath: `gs://fake-bucket/runs/${seed.runId}/manifest.json`,
    imagesPath: `gs://fake-bucket/runs/${seed.runId}/images.zip`,
    imagesSize: 4_500_000,
  };
}

export const FAKE_RUN_DOCS: ReadonlyArray<RunDoc> = RUN_SEEDS.map(buildRunDoc);

const RUN_SEEDS_BY_ID = new Map(RUN_SEEDS.map((s) => [s.runId, s] as const));

/**
 * Deterministic hash key per shot — used both as `imageHash` (manifest) and as
 * the cache key for the synthesized PNG (fake-storage.ts). Same (case, lang,
 * layout, theme) → same key → same blob across renders, so re-opening a run
 * doesn't re-generate identical images.
 */
export function fakeImageHash(
  runId: string,
  caseId: string,
  layoutId: string,
  languageCode: string,
  theme: Theme,
  diverging: boolean,
): string {
  if (diverging) {
    return `fake-${runId}-${caseId}-${layoutId}-${languageCode}-${theme}`;
  }
  // Shared hash across languages → "what changed" filter excludes this group.
  return `fake-${caseId}-${layoutId}-${theme}`;
}

export function buildFakeManifest(runId: string): Manifest | null {
  const seed = RUN_SEEDS_BY_ID.get(runId);
  if (!seed) return null;
  const diverging = new Set(seed.divergingCases ?? []);

  const shots: Manifest["shots"] = [];
  const imagesByHash = new Map<string, Manifest["images"][number]>();

  for (const c of CASES) {
    for (const lang of LANGUAGES) {
      for (const layout of LAYOUTS) {
        const theme = Theme.Light;
        const hash = fakeImageHash(runId, c.id, layout.id, lang.code, theme, diverging.has(c.id));
        if (!imagesByHash.has(hash)) {
          imagesByHash.set(hash, {
            hash,
            filename: `${hash}.png`,
            width: layout.width,
            height: layout.height,
            bytes: 60_000,
            format: ImageFormat.Png,
          });
        }
        const id = `${c.id}__${lang.code}__${layout.id}`;
        const isFailed =
          (seed.failedCount ?? 0) > 0 &&
          shots.length < (seed.failedCount ?? 0) &&
          c.id === "billing";
        shots.push({
          id,
          caseId: c.id,
          layoutId: layout.id,
          languageCode: lang.code,
          theme,
          platform: layout.id === "iphone-15" ? Platform.Ios : Platform.Android,
          imageHash: hash,
          capturedAt: new Date(NOW - seed.hoursAgo * HOUR).toISOString(),
          renderDurationMs: 140 + (c.id.length % 10) * 5,
          status: isFailed ? ShotStatus.Failed : ShotStatus.Ok,
        });
      }
    }
  }

  const failedShots = shots.filter((s) => s.status === ShotStatus.Failed).length;

  return {
    schemaVersion: 1,
    runId,
    createdAt: new Date(NOW - seed.hoursAgo * HOUR).toISOString(),
    git: {
      repository: {
        owner: "DoctorinaAI",
        name: "doctorina",
        url: "https://github.com/DoctorinaAI/doctorina",
      },
      branch: seed.branch,
      commit: {
        sha: seed.commit.sha,
        shaShort: commitShort(seed.commit.sha),
        subject: seed.commit.subject,
        body: "",
        author: {
          name: seed.author.name,
          email: seed.author.email,
          date: new Date(NOW - seed.hoursAgo * HOUR).toISOString(),
        },
        committer: {
          name: seed.author.name,
          email: seed.author.email,
          date: new Date(NOW - seed.hoursAgo * HOUR).toISOString(),
        },
      },
    },
    pr:
      seed.prNumber !== undefined
        ? {
            number: seed.prNumber,
            title: seed.commit.subject,
            body: "",
            author: seed.author.email,
            baseBranch: "main",
            headBranch: seed.branch,
            url: `https://github.com/DoctorinaAI/doctorina/pull/${seed.prNumber}`,
            labels: ["preview"],
          }
        : undefined,
    workflow: {
      trigger: seed.trigger,
      runId: seed.runId,
      runUrl: `https://github.com/DoctorinaAI/doctorina/actions/runs/${seed.runId}`,
      runAttempt: 1,
      actor: seed.author.email,
      event: seed.trigger,
      ref: `refs/heads/${seed.branch}`,
      startedAt: new Date(NOW - seed.hoursAgo * HOUR - 600_000).toISOString(),
      completedAt: new Date(NOW - seed.hoursAgo * HOUR).toISOString(),
      durationSec: 600 + (seed.failedCount ?? 0) * 8,
      runner: { os: "ubuntu-22.04", arch: "x64", image: "ubuntu-latest" },
    },
    app: {
      name: "Doctorina",
      version: seed.appVersion,
      buildNumber: 2042,
      environment: AppEnvironment.Fake,
      flutterVersion: "3.27.0",
      dartVersion: "3.6.0",
    },
    cases: CASES.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
    })),
    layouts: LAYOUTS.map((l) => ({
      id: l.id,
      name: l.name,
      width: l.width,
      height: l.height,
      dpr: l.dpr,
      orientation: l.orientation,
    })),
    languages: LANGUAGES.map((l) => ({
      code: l.code,
      name: l.name,
      direction: l.direction,
    })),
    images: [...imagesByHash.values()],
    shots,
    stats: {
      totalShots: shots.length,
      uniqueImages: imagesByHash.size,
      failedShots,
      bytesTotal: imagesByHash.size * 60_000,
      bytesDedupSaved: (shots.length - imagesByHash.size) * 60_000,
    },
  };
}

export { CASES as FAKE_CASES, LANGUAGES as FAKE_LANGUAGES, LAYOUTS as FAKE_LAYOUTS };
