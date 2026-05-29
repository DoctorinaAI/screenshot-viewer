import { Timestamp } from "firebase/firestore";
import { describe, expect, it } from "vitest";
import {
  AppEnvironment,
  ImageFormat,
  ManifestSchema,
  Platform,
  RunDocSchema,
  RunStatus,
  SCHEMA_VERSION,
  ShotStatus,
  TextDirection,
  Theme,
  WorkflowTrigger,
} from "./schema";

const ts = (date: string) => Timestamp.fromDate(new Date(date));

const minimalRunDoc = {
  runId: "26635914236-1",
  createdAt: ts("2026-05-29T10:00:00Z"),
  expireAt: ts("2026-06-28T10:00:00Z"),
  git: {
    branch: "develop",
    commitSha: "abcdef0123456789abcdef0123456789abcdef01",
    commitShaShort: "abcdef0",
    commitSubject: "Add new login flow",
    author: { name: "Mike Matiunin", email: "mike@doctorina.com" },
  },
  workflow: {
    trigger: WorkflowTrigger.Push,
    runUrl: "https://github.com/DoctorinaAI/doctorina/actions/runs/26635914236",
    actor: "mike-doctorina",
    status: RunStatus.Success,
    durationSec: 1234,
  },
  app: {
    version: "1.42.0+1234",
    environment: AppEnvironment.Staging,
    flutterVersion: "3.27.0",
  },
  stats: { totalShots: 1152, uniqueImages: 312, casesCount: 96, failedCount: 0 },
  languages: ["en", "ru", "ja"],
  layouts: ["phone-portrait"],
  platforms: ["ios"],
  themes: ["light"],
  manifestPath: "gs://bucket/runs/abcdef0/manifest.json",
  imagesPath: "gs://bucket/runs/abcdef0/images.zip",
  imagesSize: 52_428_800,
};

const minimalManifest = {
  schemaVersion: SCHEMA_VERSION,
  runId: "26635914236-1",
  createdAt: "2026-05-29T10:00:00Z",
  git: {
    repository: {
      owner: "DoctorinaAI",
      name: "doctorina",
      url: "https://github.com/DoctorinaAI/doctorina",
    },
    branch: "develop",
    commit: {
      sha: "abcdef0123456789abcdef0123456789abcdef01",
      shaShort: "abcdef0",
      subject: "Add new login flow",
      body: "Long description.",
      author: { name: "Mike", email: "mike@doctorina.com", date: "2026-05-29T09:55:00Z" },
      committer: { name: "Mike", email: "mike@doctorina.com", date: "2026-05-29T09:55:00Z" },
    },
  },
  workflow: {
    trigger: WorkflowTrigger.Push,
    runId: "26635914236",
    runUrl: "https://github.com/DoctorinaAI/doctorina/actions/runs/26635914236",
    runAttempt: 1,
    actor: "mike-doctorina",
    event: "push",
    ref: "refs/heads/develop",
    startedAt: "2026-05-29T09:40:00Z",
    completedAt: "2026-05-29T10:00:00Z",
    durationSec: 1200,
    runner: { os: "macOS", arch: "arm64", image: "self-hosted-mac-mini" },
  },
  app: {
    name: "doctorina",
    version: "1.42.0+1234",
    buildNumber: 1234,
    flavor: "staging",
    environment: AppEnvironment.Staging,
    flutterVersion: "3.27.0",
    dartVersion: "3.6.0",
  },
  cases: [
    {
      id: "auth/login/empty_form",
      title: "Empty form",
      description: "Login with empty fields.",
      feature: "auth",
      tags: ["smoke"],
    },
  ],
  layouts: [
    {
      id: "phone-portrait",
      name: "Phone portrait",
      width: 390,
      height: 844,
      dpr: 3,
      orientation: "portrait" as const,
    },
  ],
  languages: [{ code: "en", name: "English", direction: TextDirection.Ltr }],
  images: [
    {
      hash: "deadbeef",
      filename: "images/deadbeef.webp",
      width: 1170,
      height: 2532,
      bytes: 245_678,
      format: ImageFormat.Webp,
    },
  ],
  shots: [
    {
      id: "shot-1",
      caseId: "auth/login/empty_form",
      layoutId: "phone-portrait",
      languageCode: "en",
      theme: Theme.Light,
      platform: Platform.Ios,
      imageHash: "deadbeef",
      capturedAt: "2026-05-29T09:50:00Z",
      status: ShotStatus.Ok,
    },
  ],
  stats: {
    totalShots: 1,
    uniqueImages: 1,
    failedShots: 0,
    bytesTotal: 245_678,
    bytesDedupSaved: 0,
  },
};

describe("RunDocSchema", () => {
  it("parses a minimal valid RunDoc", () => {
    expect(() => RunDocSchema.parse(minimalRunDoc)).not.toThrow();
  });

  it("parses a RunDoc with optional pr + relatedIssue", () => {
    const withOptionals = {
      ...minimalRunDoc,
      pr: {
        number: 4242,
        title: "Add login flow",
        author: "mike-doctorina",
        baseBranch: "develop",
        url: "https://github.com/DoctorinaAI/doctorina/pull/4242",
      },
      relatedIssue: {
        number: 1000,
        title: "Spec",
        url: "https://github.com/DoctorinaAI/doctorina/issues/1000",
      },
      git: { ...minimalRunDoc.git, tag: "v1.42.0" },
    };
    expect(() => RunDocSchema.parse(withOptionals)).not.toThrow();
  });

  it("rejects unknown RunStatus", () => {
    const bad = { ...minimalRunDoc, workflow: { ...minimalRunDoc.workflow, status: "broken" } };
    expect(() => RunDocSchema.parse(bad)).toThrow();
  });

  it("rejects non-Timestamp createdAt", () => {
    const bad = { ...minimalRunDoc, createdAt: "2026-05-29T10:00:00Z" };
    expect(() => RunDocSchema.parse(bad)).toThrow();
  });

  it("rejects negative imagesSize", () => {
    const bad = { ...minimalRunDoc, imagesSize: -1 };
    expect(() => RunDocSchema.parse(bad)).toThrow();
  });
});

describe("ManifestSchema", () => {
  it("parses a minimal valid manifest", () => {
    expect(() => ManifestSchema.parse(minimalManifest)).not.toThrow();
  });

  it("rejects wrong schemaVersion", () => {
    const bad = { ...minimalManifest, schemaVersion: 99 };
    expect(() => ManifestSchema.parse(bad)).toThrow();
  });

  it("rejects unknown Platform", () => {
    const bad = {
      ...minimalManifest,
      shots: [{ ...minimalManifest.shots[0], platform: "BlackBerry" }],
    };
    expect(() => ManifestSchema.parse(bad)).toThrow();
  });

  it("accepts optional dependencies dict", () => {
    const withDeps = {
      ...minimalManifest,
      app: { ...minimalManifest.app, dependencies: { firebase_auth: "5.0.0" } },
    };
    expect(() => ManifestSchema.parse(withDeps)).not.toThrow();
  });

  it("accepts a pr block with labels[] when set", () => {
    const withPr = {
      ...minimalManifest,
      pr: {
        number: 7,
        title: "Feature",
        body: "",
        author: "mike-doctorina",
        baseBranch: "develop",
        headBranch: "feature/x",
        url: "https://github.com/DoctorinaAI/doctorina/pull/7",
        labels: ["screenshots", "auth"],
      },
    };
    expect(() => ManifestSchema.parse(withPr)).not.toThrow();
  });
});
