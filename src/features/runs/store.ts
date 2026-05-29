import type { QueryDocumentSnapshot } from "firebase/firestore";
import { createSignal } from "solid-js";
import { queryRuns } from "@/shared/api/runs";
import type { RunDoc } from "@/shared/lib/schema";
import type { RunsFilterState } from "./types";
import { toFirestoreFilter } from "./types";

interface RunsState {
  runs: RunDoc[];
  lastDoc: QueryDocumentSnapshot | null;
  hasMore: boolean;
  loading: boolean;
  error: string | null;
}

const initial: RunsState = {
  runs: [],
  lastDoc: null,
  hasMore: false,
  loading: false,
  error: null,
};

// Plain factory — caller mounts it inside a Solid root so onCleanup works.
// Filter changes drop the current list and re-fetch from page 1.
export function createRunsStore() {
  const [filter, setFilterSignal] = createSignal<RunsFilterState>({ kind: "none" });
  const [state, setState] = createSignal<RunsState>(initial);

  let inFlight = 0;

  async function load(opts: { append: boolean }) {
    const token = ++inFlight;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const page = await queryRuns({
        filters: toFirestoreFilter(filter()),
        startAfterDoc: opts.append ? state().lastDoc : null,
      });
      if (token !== inFlight) return; // a newer load() raced past us
      setState((prev) => ({
        runs: opts.append ? [...prev.runs, ...page.runs] : page.runs,
        lastDoc: page.lastDoc,
        hasMore: page.hasMore,
        loading: false,
        error: null,
      }));
    } catch (err) {
      if (token !== inFlight) return;
      const message = err instanceof Error ? err.message : String(err);
      setState((prev) => ({ ...prev, loading: false, error: message }));
    }
  }

  function setFilter(next: RunsFilterState) {
    setFilterSignal(next);
    setState(initial);
    void load({ append: false });
  }

  function loadMore() {
    if (state().loading || !state().hasMore) return;
    void load({ append: true });
  }

  function refresh() {
    setState(initial);
    void load({ append: false });
  }

  // Initial fetch.
  void load({ append: false });

  return {
    filter,
    setFilter,
    state,
    loadMore,
    refresh,
  };
}
