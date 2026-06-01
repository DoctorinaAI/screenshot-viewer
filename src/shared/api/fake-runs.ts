// Fake Firestore. Reads the static fixture list, applies the same
// one-filter-at-a-time semantics the real query enforces, and emits pages
// shaped exactly like `queryRuns` so consumers don't notice.

import type { QueryDocumentSnapshot } from "firebase/firestore";
import { FAKE_RUN_DOCS } from "@/shared/api/fake-data";
import type { RunsFilter, RunsPage } from "@/shared/api/runs";
import type { RunDoc } from "@/shared/lib/schema";

const DEFAULT_PAGE_SIZE = 30;

function matches(run: RunDoc, filter: RunsFilter): boolean {
  if (filter.branch && run.git.branch !== filter.branch) return false;
  if (filter.trigger && run.workflow.trigger !== filter.trigger) return false;
  if (filter.status && run.workflow.status !== filter.status) return false;
  if (filter.appVersion && run.app.version !== filter.appVersion) return false;
  if (filter.authorEmail && run.git.author.email !== filter.authorEmail) return false;
  if (filter.language && !run.languages.includes(filter.language)) return false;
  return true;
}

function sortByCreatedDesc(a: RunDoc, b: RunDoc): number {
  return b.createdAt.toMillis() - a.createdAt.toMillis();
}

// Mirror the real query's "only one filter at a time" guardrail so callers
// can't accidentally rely on combos that production would refuse.
function assertSingleFilter(filter: RunsFilter): void {
  const count =
    (filter.branch ? 1 : 0) +
    (filter.trigger ? 1 : 0) +
    (filter.status ? 1 : 0) +
    (filter.appVersion ? 1 : 0) +
    (filter.authorEmail ? 1 : 0) +
    (filter.language ? 1 : 0);
  if (count > 1) {
    throw new Error(
      `fake queryRuns: only one filter at a time is supported (got ${count}). Match production's composite-index policy.`,
    );
  }
}

export async function fakeQueryRuns(opts: {
  filters?: RunsFilter;
  pageSize?: number;
  startAfterDoc?: QueryDocumentSnapshot | null;
}): Promise<RunsPage> {
  const filter = opts.filters ?? {};
  assertSingleFilter(filter);
  const pageSize = opts.pageSize ?? DEFAULT_PAGE_SIZE;

  const all = FAKE_RUN_DOCS.filter((r) => matches(r, filter))
    .slice()
    .sort(sortByCreatedDesc);
  // Tiny realistic delay so loading skeletons get a chance to render.
  await delay(120);

  const startIdx = opts.startAfterDoc
    ? all.findIndex((r) => r.runId === (opts.startAfterDoc as unknown as { runId: string }).runId) +
      1
    : 0;
  const slice = all.slice(startIdx, startIdx + pageSize);
  const hasMore = startIdx + pageSize < all.length;

  // The real path returns a Firestore QueryDocumentSnapshot for `lastDoc`.
  // Consumers only feed it back into `startAfterDoc` to paginate, so a thin
  // shim that carries the runId is enough.
  const lastDoc =
    slice.length > 0
      ? (fakeSnap(slice[slice.length - 1]) as unknown as QueryDocumentSnapshot)
      : null;

  return {
    runs: slice,
    lastDoc,
    hasMore,
  };
}

export async function fakeGetRun(runId: string): Promise<RunDoc | null> {
  await delay(80);
  return FAKE_RUN_DOCS.find((r) => r.runId === runId) ?? null;
}

function fakeSnap(run: RunDoc) {
  // Bare minimum the page state needs to thread back into the next query.
  return { runId: run.runId };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
