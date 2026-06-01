import { createSignal } from "solid-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildFakeManifest, FAKE_RUN_DOCS } from "@/shared/api/fake-data";
import { fakeFetchManifest, fakeReleaseImages } from "@/shared/api/fake-storage";
import type { ImagesArchive } from "@/shared/api/storage";

describe("fakeFetchManifest", () => {
  it("returns the manifest for a known run id encoded in the gs:// URL", async () => {
    const run = FAKE_RUN_DOCS[0];
    const m = await fakeFetchManifest(run.manifestPath);
    expect(m.runId).toBe(run.runId);
  });

  it("throws on URL shapes that don't match the expected /runs/<id>/ pattern", async () => {
    await expect(fakeFetchManifest("gs://bucket/wrong-prefix/x.json")).rejects.toThrow(
      /unrecognized path/,
    );
  });

  it("throws when the run id is unknown", async () => {
    await expect(
      fakeFetchManifest("gs://fake-bucket/runs/totally-bogus/manifest.json"),
    ).rejects.toThrow(/no manifest/);
  });
});

describe("fakeReleaseImages", () => {
  let revoked: string[];
  let original: typeof URL.revokeObjectURL;

  beforeEach(() => {
    revoked = [];
    original = URL.revokeObjectURL;
    URL.revokeObjectURL = vi.fn((url: string) => {
      revoked.push(url);
    }) as typeof URL.revokeObjectURL;
  });

  afterEach(() => {
    URL.revokeObjectURL = original;
  });

  it("revokes every full + thumb blob URL and empties the urls map", () => {
    const urls = new Map<string, string>([
      ["a", "blob:fake/a"],
      ["b", "blob:fake/b"],
    ]);
    const [thumbs] = createSignal<Map<string, string>>(
      new Map([
        ["a", "blob:fake/a-thumb"],
        ["b", "blob:fake/b-thumb"],
      ]),
    );
    const archive: ImagesArchive = { urls, thumbs };
    fakeReleaseImages(archive);
    expect(revoked.sort()).toEqual([
      "blob:fake/a",
      "blob:fake/a-thumb",
      "blob:fake/b",
      "blob:fake/b-thumb",
    ]);
    expect(archive.urls.size).toBe(0);
  });

  it("is safe to call on an empty archive", () => {
    const [thumbs] = createSignal<Map<string, string>>(new Map());
    expect(() => fakeReleaseImages({ urls: new Map(), thumbs })).not.toThrow();
    expect(revoked).toEqual([]);
  });
});

describe("fakeFetchImagesArchive shape", () => {
  // We don't paint canvases here — jsdom canvas is unreliable. Instead we
  // stub the bits the function needs from canvas + URL so we can assert the
  // archive *shape* without actually rendering anything.
  it("returns ImagesArchive with one url per image and a matching thumbs map", async () => {
    const run = FAKE_RUN_DOCS[0];
    const manifest = buildFakeManifest(run.runId);
    if (!manifest) throw new Error("expected manifest");

    let createCount = 0;
    const origCreate = URL.createObjectURL;
    URL.createObjectURL = vi.fn(() => `blob:fake/${++createCount}`) as typeof URL.createObjectURL;

    // Stub OffscreenCanvas.convertToBlob via a minimal mock if jsdom lacks it.
    const hasOffscreen = typeof OffscreenCanvas !== "undefined";
    if (!hasOffscreen) {
      // jsdom path: stub canvas.toBlob to immediately return a tiny blob.
      const proto = HTMLCanvasElement.prototype as unknown as {
        toBlob: (cb: (b: Blob | null) => void) => void;
        getContext: (id: string) => CanvasRenderingContext2D | null;
      };
      proto.toBlob = (cb) => cb(new Blob([new Uint8Array([0])], { type: "image/png" }));
      // jsdom returns a stub ctx but with no methods. Provide a minimal one.
      proto.getContext = () =>
        ({
          createLinearGradient: () =>
            ({ addColorStop: () => undefined }) as unknown as CanvasGradient,
          fillRect: () => undefined,
          fillText: () => undefined,
          save: () => undefined,
          restore: () => undefined,
          translate: () => undefined,
          rotate: () => undefined,
          beginPath: () => undefined,
          moveTo: () => undefined,
          lineTo: () => undefined,
          arcTo: () => undefined,
          closePath: () => undefined,
          fill: () => undefined,
          // biome-ignore lint/suspicious/noExplicitAny: stub
          set fillStyle(_v: any) {},
          // biome-ignore lint/suspicious/noExplicitAny: stub
          set font(_v: any) {},
          // biome-ignore lint/suspicious/noExplicitAny: stub
          set textAlign(_v: any) {},
        }) as unknown as CanvasRenderingContext2D;
    }

    try {
      const { fakeFetchImagesArchive } = await import("@/shared/api/fake-storage");
      const archive = await fakeFetchImagesArchive(run.imagesPath, manifest);
      expect(archive.urls.size).toBeGreaterThan(0);
      expect(archive.thumbs().size).toBe(archive.urls.size);
      for (const hash of archive.urls.keys()) {
        expect(archive.thumbs().get(hash)).toBeDefined();
      }
    } finally {
      URL.createObjectURL = origCreate;
    }
  });
});
