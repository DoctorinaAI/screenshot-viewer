// Firestore query helpers for the `runs/` collection. Every filter combo
// shipped here must have a matching composite index in
// `firebase/firestore.indexes.json` (already deployed). Every doc is parsed
// through Zod — see `docs/manifest-schema.md`.

import {
  collection,
  doc,
  limit as fLimit,
  getDoc,
  getDocs,
  orderBy,
  type QueryConstraint,
  type QueryDocumentSnapshot,
  query,
  startAfter,
  where,
} from "firebase/firestore";
import {
  type RunDoc,
  RunDocSchema,
  type RunStatus,
  type WorkflowTrigger,
} from "@/shared/lib/schema";
import { firestore } from "./firebase";

export interface RunsFilter {
  branch?: string;
  trigger?: WorkflowTrigger;
  status?: RunStatus;
  appVersion?: string;
  authorEmail?: string;
  language?: string;
}

export interface RunsPage {
  runs: RunDoc[];
  lastDoc: QueryDocumentSnapshot | null;
  hasMore: boolean;
}

const DEFAULT_PAGE_SIZE = 30;

export async function queryRuns(opts: {
  filters?: RunsFilter;
  pageSize?: number;
  startAfterDoc?: QueryDocumentSnapshot | null;
}): Promise<RunsPage> {
  const pageSize = opts.pageSize ?? DEFAULT_PAGE_SIZE;
  const constraints = filterToConstraints(opts.filters ?? {});
  constraints.push(orderBy("createdAt", "desc"));
  if (opts.startAfterDoc) constraints.push(startAfter(opts.startAfterDoc));
  // Fetch one extra to detect hasMore without a separate count.
  constraints.push(fLimit(pageSize + 1));

  const snap = await getDocs(query(collection(firestore(), "runs"), ...constraints));
  const docs = snap.docs.slice(0, pageSize);
  const runs = docs.map((d) => RunDocSchema.parse(d.data()));
  return {
    runs,
    lastDoc: docs.length > 0 ? docs[docs.length - 1] : null,
    hasMore: snap.docs.length > pageSize,
  };
}

export async function getRun(runId: string): Promise<RunDoc | null> {
  const snap = await getDoc(doc(firestore(), "runs", runId));
  if (!snap.exists()) return null;
  return RunDocSchema.parse(snap.data());
}

function filterToConstraints(filter: RunsFilter): QueryConstraint[] {
  // At most ONE of these is set at a time on the landing — the composite
  // indexes are paired with `createdAt DESC`. Combining two filters would
  // need a new index, so callers should constrain to one (or none).
  const out: QueryConstraint[] = [];
  if (filter.branch) out.push(where("git.branch", "==", filter.branch));
  if (filter.trigger) out.push(where("workflow.trigger", "==", filter.trigger));
  if (filter.status) out.push(where("workflow.status", "==", filter.status));
  if (filter.appVersion) out.push(where("app.version", "==", filter.appVersion));
  if (filter.authorEmail) out.push(where("git.author.email", "==", filter.authorEmail));
  if (filter.language) out.push(where("languages", "array-contains", filter.language));
  if (out.length > 1) {
    throw new Error(
      `queryRuns: only one filter at a time is supported (got ${out.length}). Add a composite index in firebase/firestore.indexes.json before lifting this restriction.`,
    );
  }
  return out;
}
