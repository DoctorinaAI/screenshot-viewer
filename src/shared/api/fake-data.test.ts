import { describe, expect, it } from "vitest";
import {
  buildFakeManifest,
  FAKE_CASES,
  FAKE_LANGUAGES,
  FAKE_LAYOUTS,
  FAKE_RUN_DOCS,
  fakeImageHash,
} from "@/shared/api/fake-data";
import { ManifestSchema, RunDocSchema, Theme } from "@/shared/lib/schema";

describe("FAKE_RUN_DOCS", () => {
  it("is non-empty and exposes at least 6 unique run IDs", () => {
    expect(FAKE_RUN_DOCS.length).toBeGreaterThanOrEqual(6);
    const ids = new Set(FAKE_RUN_DOCS.map((r) => r.runId));
    expect(ids.size).toBe(FAKE_RUN_DOCS.length);
  });

  it("every doc validates against RunDocSchema", () => {
    for (const run of FAKE_RUN_DOCS) {
      // Zod throws on failure — assert no throw and check parsed identity.
      const parsed = RunDocSchema.parse(run);
      expect(parsed.runId).toBe(run.runId);
    }
  });
});

describe("buildFakeManifest", () => {
  it("returns null for an unknown run id", () => {
    expect(buildFakeManifest("does-not-exist")).toBeNull();
  });

  it("returns a manifest that validates against ManifestSchema for every fixture run", () => {
    for (const run of FAKE_RUN_DOCS) {
      const manifest = buildFakeManifest(run.runId);
      expect(manifest, `manifest for ${run.runId}`).not.toBeNull();
      const parsed = ManifestSchema.parse(manifest);
      expect(parsed.runId).toBe(run.runId);
    }
  });

  it("declares one image per unique imageHash referenced by shots", () => {
    const run = FAKE_RUN_DOCS[0];
    const m = buildFakeManifest(run.runId);
    if (!m) throw new Error("expected manifest");
    const shotHashes = new Set(m.shots.map((s) => s.imageHash));
    const imageHashes = new Set(m.images.map((i) => i.hash));
    for (const h of shotHashes) {
      expect(imageHashes.has(h)).toBe(true);
    }
  });

  it("uses cases, languages, and layouts from the fixture pools", () => {
    const m = buildFakeManifest(FAKE_RUN_DOCS[0].runId);
    if (!m) throw new Error("expected manifest");
    expect(m.cases.length).toBe(FAKE_CASES.length);
    expect(m.languages.length).toBe(FAKE_LANGUAGES.length);
    expect(m.layouts.length).toBe(FAKE_LAYOUTS.length);
  });
});

describe("fakeImageHash", () => {
  it("returns the same hash for non-diverging cases across languages", () => {
    const a = fakeImageHash("r1", "login", "iphone-15", "en", Theme.Light, false);
    const b = fakeImageHash("r1", "login", "iphone-15", "ru", Theme.Light, false);
    expect(a).toBe(b);
  });

  it("returns different hashes per language when diverging", () => {
    const a = fakeImageHash("r1", "login", "iphone-15", "en", Theme.Light, true);
    const b = fakeImageHash("r1", "login", "iphone-15", "ru", Theme.Light, true);
    expect(a).not.toBe(b);
  });

  it("includes runId when diverging so two runs don't share a hash", () => {
    const a = fakeImageHash("r1", "login", "iphone-15", "en", Theme.Light, true);
    const b = fakeImageHash("r2", "login", "iphone-15", "en", Theme.Light, true);
    expect(a).not.toBe(b);
  });
});
