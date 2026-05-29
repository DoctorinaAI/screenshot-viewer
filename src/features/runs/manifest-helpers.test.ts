import { describe, expect, it } from "vitest";
import {
  AppEnvironment,
  ImageFormat,
  type Manifest,
  Platform,
  SCHEMA_VERSION,
  ShotStatus,
  TextDirection,
  Theme,
  WorkflowTrigger,
} from "@/shared/lib/schema";
import { emptyFilters, filterShots, groupShots, type Shot } from "./manifest-helpers";

function makeShot(over: Partial<Shot>): Shot {
  return {
    id: "s1",
    caseId: "auth/login",
    layoutId: "phone-portrait",
    languageCode: "en",
    theme: Theme.Light,
    platform: Platform.Ios,
    imageHash: "hash-a",
    capturedAt: "2026-05-29T09:00:00Z",
    status: ShotStatus.Ok,
    ...over,
  };
}

function makeManifest(shots: Shot[]): Manifest {
  return {
    schemaVersion: SCHEMA_VERSION,
    runId: "test",
    createdAt: "2026-05-29T09:00:00Z",
    git: {
      repository: { owner: "DoctorinaAI", name: "doctorina", url: "" },
      branch: "develop",
      commit: {
        sha: "x",
        shaShort: "x",
        subject: "x",
        body: "",
        author: { name: "", email: "", date: "" },
        committer: { name: "", email: "", date: "" },
      },
    },
    workflow: {
      trigger: WorkflowTrigger.Push,
      runId: "1",
      runUrl: "",
      runAttempt: 1,
      actor: "x",
      event: "push",
      ref: "refs/heads/develop",
      startedAt: "",
      completedAt: "",
      durationSec: 0,
      runner: { os: "macOS", arch: "arm64", image: "" },
    },
    app: {
      name: "doctorina",
      version: "1.0.0",
      buildNumber: 1,
      flavor: "staging",
      environment: AppEnvironment.Staging,
      flutterVersion: "3.27.0",
      dartVersion: "3.6.0",
    },
    cases: [
      { id: "auth/login", title: "Login", description: "", feature: "auth", tags: [] },
      { id: "auth/signup", title: "Signup", description: "", feature: "auth", tags: [] },
    ],
    layouts: [
      {
        id: "phone-portrait",
        name: "Phone portrait",
        width: 390,
        height: 844,
        dpr: 3,
        orientation: "portrait",
      },
    ],
    languages: [
      { code: "en", name: "English", direction: TextDirection.Ltr },
      { code: "ru", name: "Russian", direction: TextDirection.Ltr },
    ],
    images: [
      {
        hash: "hash-a",
        filename: "images/hash-a.webp",
        width: 1,
        height: 1,
        bytes: 0,
        format: ImageFormat.Webp,
      },
      {
        hash: "hash-b",
        filename: "images/hash-b.webp",
        width: 1,
        height: 1,
        bytes: 0,
        format: ImageFormat.Webp,
      },
    ],
    shots,
    stats: {
      totalShots: shots.length,
      uniqueImages: 0,
      failedShots: 0,
      bytesTotal: 0,
      bytesDedupSaved: 0,
    },
  };
}

describe("filterShots", () => {
  const shots = [
    makeShot({ id: "1", languageCode: "en", layoutId: "phone-portrait" }),
    makeShot({ id: "2", languageCode: "ru", layoutId: "phone-portrait" }),
  ];
  const manifest = makeManifest(shots);

  it("returns all when no filters", () => {
    expect(filterShots(manifest, emptyFilters())).toHaveLength(2);
  });

  it("filters by languages set", () => {
    const f = emptyFilters();
    f.languages = new Set(["en"]);
    const out = filterShots(manifest, f);
    expect(out.map((s) => s.id)).toEqual(["1"]);
  });

  it("filters by platforms set", () => {
    const m = makeManifest([
      makeShot({ id: "1", platform: Platform.Ios }),
      makeShot({ id: "2", platform: Platform.Android }),
    ]);
    const f = emptyFilters();
    f.platforms = new Set([Platform.Android]);
    expect(filterShots(m, f).map((s) => s.id)).toEqual(["2"]);
  });

  it("whatChangedOnly keeps only (case, layout) groups with multiple hashes", () => {
    const m = makeManifest([
      makeShot({ id: "1", caseId: "a", layoutId: "L", imageHash: "X" }),
      makeShot({ id: "2", caseId: "a", layoutId: "L", imageHash: "Y" }),
      makeShot({ id: "3", caseId: "b", layoutId: "L", imageHash: "Z" }),
      makeShot({ id: "4", caseId: "b", layoutId: "L", imageHash: "Z" }),
    ]);
    const f = emptyFilters();
    f.whatChangedOnly = true;
    expect(
      filterShots(m, f)
        .map((s) => s.id)
        .sort(),
    ).toEqual(["1", "2"]);
  });
});

describe("groupShots", () => {
  const shots = [
    makeShot({ id: "1", languageCode: "en", caseId: "auth/login", imageHash: "X" }),
    makeShot({ id: "2", languageCode: "ru", caseId: "auth/login", imageHash: "Y" }),
    makeShot({ id: "3", languageCode: "en", caseId: "auth/signup", imageHash: "Z" }),
  ];
  const manifest = makeManifest(shots);

  it("groups by case", () => {
    const out = groupShots(manifest, shots, "case");
    expect(out.map((g) => ({ id: g.id, n: g.shots.length, diff: g.hasDifferences }))).toEqual([
      { id: "auth/login", n: 2, diff: true },
      { id: "auth/signup", n: 1, diff: false },
    ]);
  });

  it("groups by language", () => {
    const out = groupShots(manifest, shots, "language");
    expect(out.map((g) => g.id).sort()).toEqual(["en", "ru"]);
  });

  it("uses case title from manifest", () => {
    const [g] = groupShots(manifest, shots, "case");
    expect(g.title).toBe("Login");
  });

  it("uses language name from manifest", () => {
    const out = groupShots(manifest, shots, "language");
    const en = out.find((g) => g.id === "en");
    expect(en?.title).toBe("English");
  });

  it("sorts failed shots first within a group", () => {
    const s = [
      makeShot({ id: "ok", status: ShotStatus.Ok }),
      makeShot({ id: "failed", status: ShotStatus.Failed }),
      makeShot({ id: "warn", status: ShotStatus.Warning }),
    ];
    const m = makeManifest(s);
    const [g] = groupShots(m, s, "case");
    expect(g.shots.map((x) => x.id)).toEqual(["failed", "warn", "ok"]);
  });
});
