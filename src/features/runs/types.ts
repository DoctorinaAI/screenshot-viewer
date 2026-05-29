import type { RunsFilter } from "@/shared/api/runs";

// What kind of filter is active right now. The Firestore side enforces
// one-filter-at-a-time (one composite index per filter), so the union
// over keys reflects that constraint at the UI level too.
export type RunsFilterKey = keyof RunsFilter;

export type RunsFilterState =
  | { kind: "none" }
  | { kind: "branch"; value: string }
  | { kind: "trigger"; value: NonNullable<RunsFilter["trigger"]> }
  | { kind: "status"; value: NonNullable<RunsFilter["status"]> }
  | { kind: "language"; value: string }
  | { kind: "appVersion"; value: string }
  | { kind: "authorEmail"; value: string };

export function toFirestoreFilter(state: RunsFilterState): RunsFilter {
  switch (state.kind) {
    case "none":
      return {};
    case "branch":
      return { branch: state.value };
    case "trigger":
      return { trigger: state.value };
    case "status":
      return { status: state.value };
    case "language":
      return { language: state.value };
    case "appVersion":
      return { appVersion: state.value };
    case "authorEmail":
      return { authorEmail: state.value };
  }
}
