import type { QueryDocumentSnapshot } from "firebase/firestore";
import { describe, expect, it } from "vitest";
import { FAKE_RUN_DOCS } from "@/shared/api/fake-data";
import { fakeGetRun, fakeQueryRuns } from "@/shared/api/fake-runs";

describe("fakeQueryRuns", () => {
  it("returns all fixture runs newest-first when no filter", async () => {
    const page = await fakeQueryRuns({});
    expect(page.runs.length).toBe(FAKE_RUN_DOCS.length);
    for (let i = 1; i < page.runs.length; i++) {
      expect(page.runs[i - 1].createdAt.toMillis()).toBeGreaterThanOrEqual(
        page.runs[i].createdAt.toMillis(),
      );
    }
  });

  it("respects pageSize and reports hasMore", async () => {
    const page = await fakeQueryRuns({ pageSize: 3 });
    expect(page.runs.length).toBe(3);
    expect(page.hasMore).toBe(true);
    expect(page.lastDoc).not.toBeNull();
  });

  it("paginates via startAfterDoc", async () => {
    const first = await fakeQueryRuns({ pageSize: 3 });
    const second = await fakeQueryRuns({ pageSize: 3, startAfterDoc: first.lastDoc });
    const firstIds = new Set(first.runs.map((r) => r.runId));
    for (const r of second.runs) {
      expect(firstIds.has(r.runId)).toBe(false);
    }
  });

  it("filters by branch", async () => {
    const sample = FAKE_RUN_DOCS[0];
    const page = await fakeQueryRuns({ filters: { branch: sample.git.branch } });
    expect(page.runs.length).toBeGreaterThan(0);
    for (const r of page.runs) expect(r.git.branch).toBe(sample.git.branch);
  });

  it("filters by language (array-contains semantics)", async () => {
    const page = await fakeQueryRuns({ filters: { language: "es" } });
    expect(page.runs.length).toBeGreaterThan(0);
    for (const r of page.runs) expect(r.languages).toContain("es");
  });

  it("rejects multiple simultaneous filters to mirror production's composite-index policy", async () => {
    await expect(fakeQueryRuns({ filters: { branch: "main", language: "en" } })).rejects.toThrow(
      /only one filter at a time/,
    );
  });

  it("returns an empty page when no run matches", async () => {
    const page = await fakeQueryRuns({ filters: { branch: "never-created-branch" } });
    expect(page.runs).toEqual([]);
    expect(page.hasMore).toBe(false);
    expect(page.lastDoc).toBeNull();
  });

  it("uses default pageSize of 30 when none is provided", async () => {
    const page = await fakeQueryRuns({});
    expect(page.runs.length).toBeLessThanOrEqual(30);
  });

  it("startAfterDoc whose runId is missing falls back to page 1", async () => {
    const ghost = { runId: "ghost" } as unknown as QueryDocumentSnapshot;
    const page = await fakeQueryRuns({ pageSize: 3, startAfterDoc: ghost });
    // findIndex returns -1, +1 = 0, so we start at the top.
    expect(page.runs.length).toBe(3);
  });
});

describe("fakeGetRun", () => {
  it("returns the run when it exists", async () => {
    const target = FAKE_RUN_DOCS[0];
    const got = await fakeGetRun(target.runId);
    expect(got?.runId).toBe(target.runId);
  });

  it("returns null when the run does not exist", async () => {
    const got = await fakeGetRun("nope");
    expect(got).toBeNull();
  });
});
