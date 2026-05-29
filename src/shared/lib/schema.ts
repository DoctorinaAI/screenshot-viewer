// Single source of truth on the TypeScript side. Mirror non-backward-compatible
// changes in scripts/upload_integration_screenshots.py on DoctorinaAI/doctorina
// and bump SCHEMA_VERSION here AND in the Python writer simultaneously.

import { Timestamp } from "firebase/firestore";
import { z } from "zod";

export const SCHEMA_VERSION = 1;

// ── Const-object enums ────────────────────────────────────────────────────

export const RunStatus = {
  Success: "success",
  Partial: "partial",
  Failed: "failed",
} as const;
export type RunStatus = (typeof RunStatus)[keyof typeof RunStatus];
const RunStatusValues = [RunStatus.Success, RunStatus.Partial, RunStatus.Failed] as const;

export const WorkflowTrigger = {
  Push: "push",
  PullRequest: "pull_request",
  WorkflowDispatch: "workflow_dispatch",
  Schedule: "schedule",
} as const;
export type WorkflowTrigger = (typeof WorkflowTrigger)[keyof typeof WorkflowTrigger];
const WorkflowTriggerValues = [
  WorkflowTrigger.Push,
  WorkflowTrigger.PullRequest,
  WorkflowTrigger.WorkflowDispatch,
  WorkflowTrigger.Schedule,
] as const;

export const AppEnvironment = {
  Development: "development",
  Staging: "staging",
  Production: "production",
  Fake: "fake",
} as const;
export type AppEnvironment = (typeof AppEnvironment)[keyof typeof AppEnvironment];
const AppEnvironmentValues = [
  AppEnvironment.Development,
  AppEnvironment.Staging,
  AppEnvironment.Production,
  AppEnvironment.Fake,
] as const;

export const ShotStatus = {
  Ok: "ok",
  Warning: "warning",
  Failed: "failed",
} as const;
export type ShotStatus = (typeof ShotStatus)[keyof typeof ShotStatus];
const ShotStatusValues = [ShotStatus.Ok, ShotStatus.Warning, ShotStatus.Failed] as const;

export const ImageFormat = {
  Png: "png",
  Webp: "webp",
} as const;
export type ImageFormat = (typeof ImageFormat)[keyof typeof ImageFormat];
const ImageFormatValues = [ImageFormat.Png, ImageFormat.Webp] as const;

export const TextDirection = {
  Ltr: "ltr",
  Rtl: "rtl",
} as const;
export type TextDirection = (typeof TextDirection)[keyof typeof TextDirection];
const TextDirectionValues = [TextDirection.Ltr, TextDirection.Rtl] as const;

export const Theme = {
  Light: "light",
  Dark: "dark",
  System: "system",
} as const;
export type Theme = (typeof Theme)[keyof typeof Theme];
const ThemeValues = [Theme.Light, Theme.Dark, Theme.System] as const;

export const Platform = {
  Ios: "ios",
  Android: "android",
  Web: "web",
  Macos: "macos",
  Linux: "linux",
  Windows: "windows",
} as const;
export type Platform = (typeof Platform)[keyof typeof Platform];
const PlatformValues = [
  Platform.Ios,
  Platform.Android,
  Platform.Web,
  Platform.Macos,
  Platform.Linux,
  Platform.Windows,
] as const;

const OrientationValues = ["portrait", "landscape"] as const;

// ── Custom: Firestore Timestamp ───────────────────────────────────────────

const ZTimestamp = z.custom<Timestamp>((v) => v instanceof Timestamp, {
  message: "Expected Firestore Timestamp",
});

// ── RunDoc — Firestore `runs/{runId}` ─────────────────────────────────────

const ZGitAuthor = z.object({
  name: z.string(),
  email: z.string(),
  avatarUrl: z.string().optional(),
});

const ZRunDocPr = z.object({
  number: z.number().int().nonnegative(),
  title: z.string(),
  author: z.string(),
  baseBranch: z.string(),
  url: z.string(),
});

const ZRelatedIssue = z.object({
  number: z.number().int().nonnegative(),
  title: z.string(),
  url: z.string(),
});

export const RunDocSchema = z.object({
  runId: z.string().min(1),
  createdAt: ZTimestamp,
  expireAt: ZTimestamp,

  git: z.object({
    branch: z.string(),
    commitSha: z.string(),
    commitShaShort: z.string(),
    commitSubject: z.string(),
    author: ZGitAuthor,
    tag: z.string().optional(),
  }),

  pr: ZRunDocPr.optional(),

  workflow: z.object({
    trigger: z.enum(WorkflowTriggerValues),
    runUrl: z.string(),
    actor: z.string(),
    status: z.enum(RunStatusValues),
    durationSec: z.number().nonnegative(),
  }),

  app: z.object({
    version: z.string(),
    environment: z.enum(AppEnvironmentValues),
    flutterVersion: z.string(),
  }),

  relatedIssue: ZRelatedIssue.optional(),

  stats: z.object({
    totalShots: z.number().int().nonnegative(),
    uniqueImages: z.number().int().nonnegative(),
    casesCount: z.number().int().nonnegative(),
    failedCount: z.number().int().nonnegative(),
  }),

  languages: z.array(z.string()),
  layouts: z.array(z.string()),
  platforms: z.array(z.string()),
  themes: z.array(z.string()),

  manifestPath: z.string(),
  imagesPath: z.string(),
  imagesSize: z.number().int().nonnegative(),
});

export type RunDoc = z.infer<typeof RunDocSchema>;

// ── Manifest — Storage `runs/<sha>/manifest.json` ─────────────────────────

const ZManifestRepository = z.object({
  owner: z.string(),
  name: z.string(),
  url: z.string(),
});

const ZManifestCommitPerson = z.object({
  name: z.string(),
  email: z.string(),
  date: z.string(),
});

const ZManifestCommit = z.object({
  sha: z.string(),
  shaShort: z.string(),
  subject: z.string(),
  body: z.string(),
  author: ZManifestCommitPerson,
  committer: ZManifestCommitPerson,
});

const ZManifestPr = z.object({
  number: z.number().int().nonnegative(),
  title: z.string(),
  body: z.string(),
  author: z.string(),
  baseBranch: z.string(),
  headBranch: z.string(),
  url: z.string(),
  labels: z.array(z.string()),
});

const ZManifestRunner = z.object({
  os: z.string(),
  arch: z.string(),
  image: z.string(),
});

const ZManifestApp = z.object({
  name: z.string(),
  version: z.string(),
  buildNumber: z.number().int(),
  flavor: z.string(),
  environment: z.enum(AppEnvironmentValues),
  flutterVersion: z.string(),
  dartVersion: z.string(),
  dependencies: z.record(z.string(), z.string()).optional(),
});

const ZManifestCase = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  feature: z.string(),
  tags: z.array(z.string()),
  sourceFile: z.string().optional(),
});

const ZManifestLayout = z.object({
  id: z.string(),
  name: z.string(),
  deviceModel: z.string().optional(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  dpr: z.number().positive(),
  orientation: z.enum(OrientationValues),
});

const ZManifestLanguage = z.object({
  code: z.string(),
  name: z.string(),
  direction: z.enum(TextDirectionValues),
});

const ZManifestImage = z.object({
  hash: z.string(),
  filename: z.string(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  bytes: z.number().int().nonnegative(),
  format: z.enum(ImageFormatValues),
});

const ZManifestShot = z.object({
  id: z.string(),
  caseId: z.string(),
  layoutId: z.string(),
  languageCode: z.string(),
  theme: z.enum(ThemeValues),
  platform: z.enum(PlatformValues),
  imageHash: z.string(),
  capturedAt: z.string(),
  renderDurationMs: z.number().nonnegative().optional(),
  status: z.enum(ShotStatusValues),
  warnings: z.array(z.string()).optional(),
  annotations: z.record(z.string(), z.unknown()).optional(),
});

export const ManifestSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  runId: z.string(),
  createdAt: z.string(),

  git: z.object({
    repository: ZManifestRepository,
    branch: z.string(),
    commit: ZManifestCommit,
    tag: z.string().optional(),
    baseSha: z.string().optional(),
  }),

  pr: ZManifestPr.optional(),

  workflow: z.object({
    trigger: z.enum(WorkflowTriggerValues),
    runId: z.string(),
    runUrl: z.string(),
    runAttempt: z.number().int().positive(),
    actor: z.string(),
    event: z.string(),
    ref: z.string(),
    startedAt: z.string(),
    completedAt: z.string(),
    durationSec: z.number().nonnegative(),
    runner: ZManifestRunner,
  }),

  app: ZManifestApp,

  relatedIssues: z.array(ZRelatedIssue).optional(),

  cases: z.array(ZManifestCase),
  layouts: z.array(ZManifestLayout),
  languages: z.array(ZManifestLanguage),
  images: z.array(ZManifestImage),
  shots: z.array(ZManifestShot),

  stats: z.object({
    totalShots: z.number().int().nonnegative(),
    uniqueImages: z.number().int().nonnegative(),
    failedShots: z.number().int().nonnegative(),
    bytesTotal: z.number().int().nonnegative(),
    bytesDedupSaved: z.number().int().nonnegative(),
  }),
});

export type Manifest = z.infer<typeof ManifestSchema>;
