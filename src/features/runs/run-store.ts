// Run page state. One store instance per /runs/:runId visit.
//
// Phase 1 (mount): fetch RunDoc → fetch manifest.json → store in `manifest`
//                  signal. Card grid renders placeholders only.
// Phase 2 (intent): on first ShotGrid intersection, fetch images.zip and
//                   unzip via fflate. `images` signal updates; tiles swap
//                   from placeholders to blob URLs.
// On route exit, releaseImages() revokes every URL.

import { createSignal, onCleanup } from "solid-js";
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

export interface RunStoreState {
  loading: boolean;
  run: RunDoc | null;
  manifest: Manifest | null;
  archive: ImagesArchive | null;
  archiveLoading: boolean;
  error: string | null;
}

export interface RunStore {
  state: () => RunStoreState;
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

export function createRunStore(runId: string): RunStore {
  const [state, setState] = createSignal<RunStoreState>(initial);
  const [groupBy, setGroupBy] = createSignal<GroupBy>("case");
  const [filters, setFilters] = createSignal<RunFilters>(emptyFilters());

  let archiveRequested = false;

  async function loadRun() {
    setState({ ...initial, loading: true });
    try {
      const run = await getRun(runId);
      if (!run) {
        setState((prev) => ({ ...prev, loading: false, error: "Run not found." }));
        return;
      }
      const manifest = await fetchManifest(run.manifestPath);
      setState((prev) => ({ ...prev, loading: false, run, manifest }));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setState((prev) => ({ ...prev, loading: false, error: message }));
    }
  }

  async function loadArchive() {
    const run = state().run;
    const manifest = state().manifest;
    if (!run || !manifest) return;
    setState((prev) => ({ ...prev, archiveLoading: true }));
    try {
      const archive = await fetchImagesArchive(run.imagesPath, manifest);
      setState((prev) => ({ ...prev, archive, archiveLoading: false }));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setState((prev) => ({ ...prev, archiveLoading: false, error: message }));
    }
  }

  function ensureArchive() {
    if (archiveRequested) return;
    if (!state().manifest) return;
    archiveRequested = true;
    void loadArchive();
  }

  void loadRun();

  onCleanup(() => {
    const archive = state().archive;
    if (archive) releaseImages(archive);
  });

  const filteredShots = () => {
    const m = state().manifest;
    if (!m) return [] as Shot[];
    return filterShots(m, filters());
  };

  const groups = () => {
    const m = state().manifest;
    if (!m) return [] as ShotGroup[];
    return groupShots(m, filteredShots(), groupBy());
  };

  return {
    state,
    groupBy,
    setGroupBy,
    filters,
    setFilters,
    groups,
    filteredShots,
    ensureArchive,
  };
}
