import { createRoot } from "solid-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type Page = {
  runs: Array<{ runId: string }>;
  lastDoc: { runId: string } | null;
  hasMore: boolean;
};

const queryRuns = vi.fn<(opts: unknown) => Promise<Page>>();

let createRunsStore: typeof import("./store").createRunsStore;

beforeEach(async () => {
  vi.resetModules();
  queryRuns.mockReset();
  vi.doMock("@/shared/api/runs", () => ({ queryRuns }));
  ({ createRunsStore } = await import("./store"));
});

afterEach(() => {
  vi.doUnmock("@/shared/api/runs");
});

async function flush() {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise<void>((r) => setTimeout(r, 0));
}

function inRoot<T>(fn: (dispose: () => void) => T): T {
  let result!: T;
  createRoot((dispose) => {
    result = fn(dispose);
  });
  return result;
}

describe("createRunsStore", () => {
  it("triggers an initial load on mount and surfaces the page in state", async () => {
    queryRuns.mockResolvedValueOnce({
      runs: [{ runId: "r1" }, { runId: "r2" }],
      lastDoc: { runId: "r2" },
      hasMore: true,
    });
    const { store, dispose } = inRoot((dispose) => ({ store: createRunsStore(), dispose }));
    await flush();
    expect(store.state().runs.map((r) => r.runId)).toEqual(["r1", "r2"]);
    expect(store.state().hasMore).toBe(true);
    expect(store.state().loading).toBe(false);
    dispose();
  });

  it("setFilter clears state and re-fetches page 1", async () => {
    queryRuns
      .mockResolvedValueOnce({ runs: [{ runId: "a" }], lastDoc: null, hasMore: false })
      .mockResolvedValueOnce({ runs: [{ runId: "b" }], lastDoc: null, hasMore: false });
    const { store, dispose } = inRoot((dispose) => ({ store: createRunsStore(), dispose }));
    await flush();
    store.setFilter({ kind: "branch", value: "main" });
    await flush();
    expect(store.state().runs.map((r) => r.runId)).toEqual(["b"]);
    expect(queryRuns).toHaveBeenCalledTimes(2);
    dispose();
  });

  it("loadMore appends the next page and uses startAfterDoc", async () => {
    queryRuns
      .mockResolvedValueOnce({
        runs: [{ runId: "a" }],
        lastDoc: { runId: "a" },
        hasMore: true,
      })
      .mockResolvedValueOnce({
        runs: [{ runId: "b" }, { runId: "c" }],
        lastDoc: { runId: "c" },
        hasMore: false,
      });
    const { store, dispose } = inRoot((dispose) => ({ store: createRunsStore(), dispose }));
    await flush();
    store.loadMore();
    await flush();
    expect(store.state().runs.map((r) => r.runId)).toEqual(["a", "b", "c"]);
    expect(store.state().hasMore).toBe(false);
    const lastCall = queryRuns.mock.calls[1][0] as { startAfterDoc?: { runId: string } };
    expect(lastCall.startAfterDoc?.runId).toBe("a");
    dispose();
  });

  it("loadMore is a no-op when no more pages", async () => {
    queryRuns.mockResolvedValueOnce({ runs: [], lastDoc: null, hasMore: false });
    const { store, dispose } = inRoot((dispose) => ({ store: createRunsStore(), dispose }));
    await flush();
    store.loadMore();
    store.loadMore();
    await flush();
    expect(queryRuns).toHaveBeenCalledTimes(1);
    dispose();
  });

  it("surfaces the error message on rejection", async () => {
    queryRuns.mockRejectedValueOnce(new Error("boom"));
    const { store, dispose } = inRoot((dispose) => ({ store: createRunsStore(), dispose }));
    await flush();
    expect(store.state().error).toBe("boom");
    expect(store.state().loading).toBe(false);
    dispose();
  });

  it("a stale in-flight load is dropped when a newer one starts", async () => {
    let resolveFirst: ((p: Page) => void) | null = null;
    queryRuns
      .mockImplementationOnce((): Promise<Page> => {
        return new Promise<Page>((r) => {
          resolveFirst = r;
        });
      })
      .mockResolvedValueOnce({ runs: [{ runId: "fresh" }], lastDoc: null, hasMore: false });

    const { store, dispose } = inRoot((dispose) => ({ store: createRunsStore(), dispose }));
    store.setFilter({ kind: "branch", value: "main" });
    (resolveFirst as ((p: Page) => void) | null)?.({
      runs: [{ runId: "stale" }],
      lastDoc: null,
      hasMore: false,
    });
    await flush();
    expect(store.state().runs.map((r) => r.runId)).toEqual(["fresh"]);
    dispose();
  });
});
