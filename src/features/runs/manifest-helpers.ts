// Pure transforms over a parsed Manifest. Used by the run page to switch
// grouping mode, filter shots, and surface "what changed" comparisons.

import type { Manifest, Platform, Theme } from "@/shared/lib/schema";

export type GroupBy = "case" | "language" | "layout";

export interface RunFilters {
  languages: Set<string>; // empty = all
  layouts: Set<string>;
  platforms: Set<Platform>;
  themes: Set<Theme>;
  whatChangedOnly: boolean;
}

export function emptyFilters(): RunFilters {
  return {
    languages: new Set(),
    layouts: new Set(),
    platforms: new Set(),
    themes: new Set(),
    whatChangedOnly: false,
  };
}

export type Shot = Manifest["shots"][number];

export interface ShotGroup {
  // Stable key for <For>.
  id: string;
  title: string;
  description?: string;
  shots: Shot[];
  // True when this group has > 1 unique image hash across its shots
  // (used for "what changed" highlighting).
  hasDifferences: boolean;
}

/** Filter shots in-place by language / layout / platform / theme / what-changed. */
export function filterShots(manifest: Manifest, filters: RunFilters): Shot[] {
  let shots = manifest.shots;
  if (filters.languages.size > 0) {
    shots = shots.filter((s) => filters.languages.has(s.languageCode));
  }
  if (filters.layouts.size > 0) {
    shots = shots.filter((s) => filters.layouts.has(s.layoutId));
  }
  if (filters.platforms.size > 0) {
    shots = shots.filter((s) => filters.platforms.has(s.platform));
  }
  if (filters.themes.size > 0) {
    shots = shots.filter((s) => filters.themes.has(s.theme));
  }
  if (filters.whatChangedOnly) {
    const diffKeys = whatChangedKeys(shots);
    shots = shots.filter((s) => diffKeys.has(`${s.caseId}::${s.layoutId}`));
  }
  return shots;
}

/** Group shots by case / language / layout. */
export function groupShots(manifest: Manifest, shots: Shot[], by: GroupBy): ShotGroup[] {
  switch (by) {
    case "case":
      return groupByKey(
        shots,
        (s) => s.caseId,
        (id) => {
          const c = manifest.cases.find((x) => x.id === id);
          return { title: c?.title ?? id, description: c?.description };
        },
      );
    case "language":
      return groupByKey(
        shots,
        (s) => s.languageCode,
        (code) => {
          const lang = manifest.languages.find((x) => x.code === code);
          return { title: lang?.name ?? code, description: undefined };
        },
      );
    case "layout":
      return groupByKey(
        shots,
        (s) => s.layoutId,
        (id) => {
          const l = manifest.layouts.find((x) => x.id === id);
          return {
            title: l?.name ?? id,
            description: l ? `${l.width}×${l.height} @${l.dpr}x · ${l.orientation}` : undefined,
          };
        },
      );
  }
}

function groupByKey(
  shots: Shot[],
  keyOf: (s: Shot) => string,
  meta: (key: string) => { title: string; description?: string },
): ShotGroup[] {
  const buckets = new Map<string, Shot[]>();
  for (const shot of shots) {
    const key = keyOf(shot);
    const existing = buckets.get(key);
    if (existing) existing.push(shot);
    else buckets.set(key, [shot]);
  }
  // Failed shots float to the front of each group (per docs/conventions).
  const result: ShotGroup[] = [];
  for (const [key, groupShots] of buckets) {
    groupShots.sort(failedFirst);
    const m = meta(key);
    result.push({
      id: key,
      title: m.title,
      description: m.description,
      shots: groupShots,
      hasDifferences: distinctHashes(groupShots).size > 1,
    });
  }
  // Sort groups: ones with differences first, then alphabetical.
  result.sort((a, b) => {
    if (a.hasDifferences !== b.hasDifferences) return a.hasDifferences ? -1 : 1;
    return a.title.localeCompare(b.title);
  });
  return result;
}

function failedFirst(a: Shot, b: Shot): number {
  const order = { failed: 0, warning: 1, ok: 2 } as const;
  return order[a.status] - order[b.status];
}

function distinctHashes(shots: Shot[]): Set<string> {
  const out = new Set<string>();
  for (const s of shots) out.add(s.imageHash);
  return out;
}

/** Returns keys of (caseId, layoutId) groups that resolve to > 1 image hash. */
function whatChangedKeys(shots: Shot[]): Set<string> {
  const groups = new Map<string, Set<string>>();
  for (const s of shots) {
    const key = `${s.caseId}::${s.layoutId}`;
    const set = groups.get(key) ?? new Set<string>();
    set.add(s.imageHash);
    groups.set(key, set);
  }
  const out = new Set<string>();
  for (const [key, hashes] of groups) {
    if (hashes.size > 1) out.add(key);
  }
  return out;
}
