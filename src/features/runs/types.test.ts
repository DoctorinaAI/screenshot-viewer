import { describe, expect, it } from "vitest";
import { RunStatus, WorkflowTrigger } from "@/shared/lib/schema";
import { toFirestoreFilter } from "./types";

describe("toFirestoreFilter", () => {
  it("maps 'none' to an empty filter", () => {
    expect(toFirestoreFilter({ kind: "none" })).toEqual({});
  });

  it("maps each filter kind to its single Firestore key", () => {
    expect(toFirestoreFilter({ kind: "branch", value: "main" })).toEqual({ branch: "main" });
    expect(toFirestoreFilter({ kind: "trigger", value: WorkflowTrigger.Push })).toEqual({
      trigger: WorkflowTrigger.Push,
    });
    expect(toFirestoreFilter({ kind: "status", value: RunStatus.Success })).toEqual({
      status: RunStatus.Success,
    });
    expect(toFirestoreFilter({ kind: "language", value: "ru" })).toEqual({ language: "ru" });
    expect(toFirestoreFilter({ kind: "appVersion", value: "1.42.0+2042" })).toEqual({
      appVersion: "1.42.0+2042",
    });
    expect(toFirestoreFilter({ kind: "authorEmail", value: "x@doctorina.com" })).toEqual({
      authorEmail: "x@doctorina.com",
    });
  });

  it("each non-'none' state produces exactly one filter key", () => {
    const kinds = [
      { kind: "branch", value: "main" },
      { kind: "trigger", value: WorkflowTrigger.Push },
      { kind: "status", value: RunStatus.Success },
      { kind: "language", value: "ru" },
      { kind: "appVersion", value: "1.0.0" },
      { kind: "authorEmail", value: "a@b.com" },
    ] as const;
    for (const k of kinds) {
      const out = toFirestoreFilter(k);
      expect(Object.keys(out)).toHaveLength(1);
    }
  });
});
