import { createRoot, createSignal } from "solid-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AppEnvironment,
  type Manifest,
  Platform,
  type RunDoc,
  RunStatus,
  SCHEMA_VERSION,
  TextDirection,
  Theme,
  WorkflowTrigger,
} from "@/shared/lib/schema";

function ts(ms: number) {
  return {
    toMillis: () => ms,
    toDate: () => new Date(ms),
    seconds: Math.floor(ms / 1000),
    nanoseconds: 0,
  } as unknown as RunDoc["createdAt"];
}

function makeRun(id: string): RunDoc {
  return {
    runId: id,
    createdAt: ts(0),
    expireAt: ts(90 * 24 * 60 * 60 * 1000),
    git: {
      branch: "main",
      commitSha: "x",
      commitShaShort: "x",
      commitSubject: "x",
      author: { name: "", email: "" },
    },
    workflow: {
      trigger: WorkflowTrigger.Push,
      runUrl: "",
      actor: "x",
      status: RunStatus.Success,
      durationSec: 0,
    },
    app: {
      version: "1.0.0",
      environment: AppEnvironment.Staging,
      flutterVersion: "3.27.0",
    },
    stats: { totalShots: 0, uniqueImages: 0, casesCount: 0, failedCount: 0 },
    languages: ["en"],
    layouts: ["L"],
    platforms: [Platform.Ios],
    themes: [Theme.Light],
    manifestPath: `gs://b/runs/${id}/manifest.json`,
    imagesPath: `gs://b/runs/${id}/images.zip`,
    imagesSize: 0,
  };
}

function makeManifest(): Manifest {
  return {
    schemaVersion: SCHEMA_VERSION,
    runId: "r",
    createdAt: "2026-01-01T00:00:00Z",
    git: {
      repository: { owner: "x", name: "x", url: "" },
      branch: "main",
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
      ref: "x",
      startedAt: "",
      completedAt: "",
      durationSec: 0,
      runner: { os: "macOS", arch: "arm64", image: "" },
    },
    app: {
      name: "x",
      version: "1.0.0",
      buildNumber: 1,
      flavor: "staging",
      environment: AppEnvironment.Staging,
      flutterVersion: "3.27.0",
      dartVersion: "3.6.0",
    },
    cases: [],
    layouts: [],
    languages: [{ code: "en", name: "English", direction: TextDirection.Ltr }],
    images: [],
    shots: [],
    stats: { totalShots: 0, uniqueImages: 0, failedShots: 0, bytesTotal: 0, bytesDedupSaved: 0 },
  };
}

const getRun = vi.fn<(id: string) => Promise<RunDoc | null>>();
const fetchManifest = vi.fn<() => Promise<Manifest>>();
const fetchImagesArchive = vi.fn();
const releaseImages = vi.fn();

// Module-private holder for the dynamically imported factory. Resolved in
// beforeEach AFTER the mocks are wired so each test gets a fresh module graph.
let createRunStore: typeof import("./run-store").createRunStore;

beforeEach(async () => {
  vi.resetModules();
  getRun.mockReset();
  fetchManifest.mockReset();
  fetchImagesArchive.mockReset();
  releaseImages.mockReset();
  vi.doMock("@/shared/api/runs", () => ({ getRun }));
  vi.doMock("@/shared/api/storage", () => ({
    fetchManifest,
    fetchImagesArchive,
    releaseImages,
  }));
  ({ createRunStore } = await import("./run-store"));
});

afterEach(() => {
  vi.doUnmock("@/shared/api/runs");
  vi.doUnmock("@/shared/api/storage");
});

async function flush() {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise<void>((r) => setTimeout(r, 0));
}

// Wrap createRoot so each test runs the store factory INSIDE the reactive
// root (no awaits between createRoot entry and the factory call), then
// awaits + assertions happen in the outer async.
function inRoot<T>(fn: (dispose: () => void) => T): T {
  let result!: T;
  createRoot((dispose) => {
    result = fn(dispose);
  });
  return result;
}

describe("createRunStore", () => {
  it("loads run + manifest on mount and exposes them in state", async () => {
    getRun.mockResolvedValueOnce(makeRun("r-1"));
    fetchManifest.mockResolvedValueOnce(makeManifest());

    const { store, dispose } = inRoot((dispose) => ({
      store: createRunStore(() => "r-1"),
      dispose,
    }));
    await flush();
    expect(store.state().loading).toBe(false);
    expect(store.state().run?.runId).toBe("r-1");
    expect(store.state().manifest).not.toBeNull();
    expect(getRun).toHaveBeenCalledWith("r-1");
    dispose();
  });

  it("reports 'Run not found' when getRun returns null", async () => {
    getRun.mockResolvedValueOnce(null);
    const { store, dispose } = inRoot((dispose) => ({
      store: createRunStore(() => "missing"),
      dispose,
    }));
    await flush();
    expect(store.state().loading).toBe(false);
    expect(store.state().error).toBe("Run not found.");
    expect(fetchManifest).not.toHaveBeenCalled();
    dispose();
  });

  it("ensureArchive loads the archive only once until runId changes", async () => {
    getRun.mockResolvedValueOnce(makeRun("r-1"));
    fetchManifest.mockResolvedValueOnce(makeManifest());
    const [thumbs] = createSignal(new Map<string, string>());
    fetchImagesArchive.mockResolvedValueOnce({ urls: new Map(), thumbs });

    const { store, dispose } = inRoot((dispose) => ({
      store: createRunStore(() => "r-1"),
      dispose,
    }));
    await flush();
    store.ensureArchive();
    store.ensureArchive();
    store.ensureArchive();
    await flush();
    expect(fetchImagesArchive).toHaveBeenCalledTimes(1);
    expect(store.state().archive).not.toBeNull();
    dispose();
  });

  it("releases the stale archive when it lands after navigation away", async () => {
    const [runIdSig, setRunId] = createSignal("r-1");
    getRun.mockResolvedValueOnce(makeRun("r-1")).mockResolvedValueOnce(makeRun("r-2"));
    fetchManifest.mockResolvedValueOnce(makeManifest()).mockResolvedValueOnce(makeManifest());

    const [thumbs] = createSignal(new Map<string, string>());
    type Archive = { urls: Map<string, string>; thumbs: () => Map<string, string> };
    let resolveArchive: ((a: Archive) => void) | null = null;
    fetchImagesArchive.mockImplementationOnce(
      () =>
        new Promise<Archive>((r) => {
          resolveArchive = r;
        }),
    );

    const { store, dispose } = inRoot((dispose) => ({
      store: createRunStore(runIdSig),
      dispose,
    }));
    await flush();
    store.ensureArchive();
    setRunId("r-2");
    await flush();
    const staleArchive = { urls: new Map<string, string>(), thumbs };
    (resolveArchive as ((a: Archive) => void) | null)?.(staleArchive);
    await flush();
    expect(releaseImages).toHaveBeenCalledWith(staleArchive);
    dispose();
  });

  it("cleanup revokes the latest archive", async () => {
    getRun.mockResolvedValueOnce(makeRun("r-1"));
    fetchManifest.mockResolvedValueOnce(makeManifest());
    const [thumbs] = createSignal(new Map<string, string>());
    const archive = { urls: new Map([["h", "blob:x"]]), thumbs };
    fetchImagesArchive.mockResolvedValueOnce(archive);

    const { store, dispose } = inRoot((dispose) => ({
      store: createRunStore(() => "r-1"),
      dispose,
    }));
    await flush();
    store.ensureArchive();
    await flush();
    expect(store.state().archive).not.toBeNull();
    dispose();
    expect(releaseImages).toHaveBeenCalledWith(archive);
  });

  it("groupBy and filters thread through createMemo without throwing", async () => {
    getRun.mockResolvedValueOnce(makeRun("r-1"));
    fetchManifest.mockResolvedValueOnce(makeManifest());
    const { store, dispose } = inRoot((dispose) => ({
      store: createRunStore(() => "r-1"),
      dispose,
    }));
    await flush();
    expect(store.groupBy()).toBe("case");
    store.setGroupBy("language");
    expect(store.groupBy()).toBe("language");
    expect(store.filteredShots()).toEqual([]);
    expect(store.groups()).toEqual([]);
    dispose();
  });
});
