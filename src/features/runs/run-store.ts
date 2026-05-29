// Run page state. One store instance per /runs/:runId visit, but the same
// instance survives same-route navigations (Solid Router reuses the component
// when only the param changes) — the store reacts to `runId()` and refetches.
//
// Phase 1 (mount or runId change): fetch RunDoc → fetch manifest.json.
// Phase 2 (intent): on first ShotGrid intersection, fetch images.zip and
//                   unzip via fflate. Tiles swap from placeholders to blob URLs.
//
// Lifecycle invariants enforced by the `generation` token:
//   1. A stale in-flight load (started before runId changed) never writes to
//      state — its writes are dropped.
//   2. A stale archive that resolves AFTER its run was replaced is
//      `releaseImages`'d immediately so the Blob URLs don't leak.
//   3. On unmount, `currentArchive` (the latest, not a state snapshot) is
//      released, so a navigation-during-fetch can't leave dangling URLs.

import { createEffect, createMemo, createSignal, onCleanup } from "solid-js";
import { getRun } from "@/shared/api/runs";
import {
  fetchImagesArchive,
  fetchManifest,
  type ImagesArchive,
  releaseImages,
} from "@/shared/api/storage";
import type { Manifest, RunDoc } from "@/shared/lib/schema";
import {
  emptyFilters,
  filterShots,
  type GroupBy,
  groupShots,
  type RunFilters,
  type Shot,
  type ShotGroup,
} from "./manifest-helpers";

type ManifestCase = Manifest["cases"][number];
type ManifestLayout = Manifest["layouts"][number];
type ManifestLanguage = Manifest["languages"][number];

export interface RunStoreState {
  loading: boolean;
  run: RunDoc | null;
  manifest: Manifest | null;
  archive: ImagesArchive | null;
  archiveLoading: boolean;
  error: string | null;
}

export interface ManifestIndex {
  cases: Map<string, ManifestCase>;
  layouts: Map<string, ManifestLayout>;
  languages: Map<string, ManifestLanguage>;
}

export interface RunStore {
  state: () => RunStoreState;
  manifestIndex: () => ManifestIndex | null;
  groupBy: () => GroupBy;
  setGroupBy: (next: GroupBy) => void;
  filters: () => RunFilters;
  setFilters: (next: RunFilters) => void;
  groups: () => ShotGroup[];
  filteredShots: () => Shot[];
  ensureArchive: () => void;
}

const initial: RunStoreState = {
  loading: true,
  run: null,
  manifest: null,
  archive: null,
  archiveLoading: false,
  error: null,
};

export function createRunStore(runId: () => string): RunStore {
  const [state, setState] = createSignal<RunStoreState>(initial);
  const [groupBy, setGroupBy] = createSignal<GroupBy>("case");
  const [filters, setFilters] = createSignal<RunFilters>(emptyFilters());

  // Bumped on every runId change AND on cleanup; any in-flight load that
  // sees a mismatched generation drops its result.
  let generation = 0;
  // Mirrors state().archive so cleanup can revoke the latest archive even if
  // it landed after the user navigated away.
  let currentArchive: ImagesArchive | null = null;
  let archiveRequested = false;

  async function loadRun(gen: number, id: string) {
    archiveRequested = false;
    try {
      const run = await getRun(id);
      if (gen !== generation) return;
      if (!run) {
        setState({ ...initial, loading: false, error: "Run not found." });
        return;
      }
      const manifest = await fetchManifest(run.manifestPath);
      if (gen !== generation) return;
      setState((prev) => ({ ...prev, loading: false, run, manifest }));
    } catch (err) {
      if (gen !== generation) return;
      const message = err instanceof Error ? err.message : String(err);
      setState((prev) => ({ ...prev, loading: false, error: message }));
    }
  }

  async function loadArchive(gen: number) {
    const run = state().run;
    const manifest = state().manifest;
    if (!run || !manifest) return;
    setState((prev) => ({ ...prev, archiveLoading: true }));
    try {
      const archive = await fetchImagesArchive(run.imagesPath, manifest);
      if (gen !== generation) {
        // The user moved on while the zip was downloading. Revoke the Blob
        // URLs we just minted instead of leaking them.
        releaseImages(archive);
        return;
      }
      currentArchive = archive;
      setState((prev) => ({ ...prev, archive, archiveLoading: false }));
    } catch (err) {
      if (gen !== generation) return;
      const message = err instanceof Error ? err.message : String(err);
      setState((prev) => ({ ...prev, archiveLoading: false, error: message }));
    }
  }

  function ensureArchive() {
    if (archiveRequested) return;
    if (!state().manifest) return;
    archiveRequested = true;
    void loadArchive(generation);
  }

  createEffect(() => {
    const id = runId();
    generation += 1;
    const gen = generation;
    if (currentArchive) {
      releaseImages(currentArchive);
      currentArchive = null;
    }
    setState({ ...initial, loading: true });
    void loadRun(gen, id);
  });

  onCleanup(() => {
    generation += 1;
    if (currentArchive) {
      releaseImages(currentArchive);
      currentArchive = null;
    }
  });

  const manifestIndex = createMemo<ManifestIndex | null>(() => {
    const m = state().manifest;
    if (!m) return null;
    return {
      cases: new Map(m.cases.map((c) => [c.id, c])),
      layouts: new Map(m.layouts.map((l) => [l.id, l])),
      languages: new Map(m.languages.map((l) => [l.code, l])),
    };
  });

  const filteredShots = createMemo<Shot[]>(() => {
    const m = state().manifest;
    if (!m) return [];
    return filterShots(m, filters());
  });

  const groups = createMemo<ShotGroup[]>(() => {
    const m = state().manifest;
    if (!m) return [];
    return groupShots(m, filteredShots(), groupBy());
  });

  return {
    state,
    manifestIndex,
    groupBy,
    setGroupBy,
    filters,
    setFilters,
    groups,
    filteredShots,
    ensureArchive,
  };
}
