import { unzipSync } from "fflate";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildScreenshotsZip, saveScreenshotsZip } from "@/features/runs/download-screenshots";
import { emptyFilters, filterShots, type Shot } from "@/features/runs/manifest-helpers";
import { buildFakeManifest, FAKE_RUN_DOCS } from "@/shared/api/fake-data";
import type { ImagesArchive } from "@/shared/api/storage";
import type { Manifest } from "@/shared/lib/schema";

const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
const fetchImage = vi.fn<typeof fetch>();

function shot(overrides: Partial<Shot> = {}): Shot {
  return {
    id: "s1",
    caseId: "auth/login",
    layoutId: "phone",
    languageCode: "en",
    platform: "ios",
    theme: "light",
    imageHash: "portrait",
    capturedAt: "",
    status: "ok",
    ...overrides,
  };
}

const images: Manifest["images"] = [
  {
    hash: "portrait",
    filename: "images/portrait.png",
    width: 1080,
    height: 1920,
    bytes: 8,
    format: "png",
  },
  {
    hash: "landscape",
    filename: "images/landscape.png",
    width: 1920,
    height: 1080,
    bytes: 8,
    format: "png",
  },
];

function archive(): ImagesArchive {
  return {
    urls: new Map(images.map((image) => [image.hash, `blob:${image.hash}`])),
    thumbs: () => new Map(),
  };
}

async function entries(manifest: Pick<Manifest, "images">, shots: Shot[], source = archive()) {
  const blob = await buildScreenshotsZip(manifest, shots, source);
  expect(blob.type).toBe("application/zip");
  return unzipSync(new Uint8Array(await blob.arrayBuffer()));
}

beforeEach(async () => {
  // Use fetch's Blob implementation: jsdom's Blob lacks arrayBuffer().
  const blob = await new Response().blob();
  vi.stubGlobal("Blob", blob.constructor);
  vi.stubGlobal("fetch", fetchImage);
  fetchImage.mockReset().mockImplementation(async () => new Response(png));
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("buildScreenshotsZip", () => {
  it("exports original PNG bytes under pixel resolution / language, including shared images", async () => {
    const files = await entries({ images }, [
      shot(),
      shot({ id: "s2", languageCode: "ru" }),
      shot({ id: "s3", imageHash: "landscape", layoutId: "tablet" }),
    ]);
    expect(Object.keys(files)).toEqual([
      "1080x1920/en/auth-login--phone--ios--light.png",
      "1080x1920/ru/auth-login--phone--ios--light.png",
      "1920x1080/en/auth-login--tablet--ios--light.png",
    ]);
    for (const bytes of Object.values(files)) expect(bytes).toEqual(png);
    expect(fetchImage).toHaveBeenCalledTimes(2);
  });

  it("exports only the current language, layout, platform, theme and what-changed selection", async () => {
    const fixture = buildFakeManifest(FAKE_RUN_DOCS[0].runId);
    if (!fixture) throw new Error("Expected fixture manifest");
    const manifest: Manifest = {
      ...fixture,
      images,
      shots: [
        shot(),
        shot({ id: "changed", languageCode: "ru", imageHash: "landscape" }),
        shot({ id: "language", languageCode: "es" }),
        shot({ id: "layout", layoutId: "tablet" }),
        shot({ id: "platform", platform: "android" }),
        shot({ id: "theme", theme: "dark" }),
        shot({ id: "unchanged", caseId: "settings" }),
      ],
    };
    const filters = {
      ...emptyFilters(),
      languages: new Set(["en", "ru"]),
      layouts: new Set(["phone"]),
      platforms: new Set<Shot["platform"]>(["ios"]),
      themes: new Set<Shot["theme"]>(["light"]),
      whatChangedOnly: true,
    };
    const files = await entries(manifest, filterShots(manifest, filters));
    expect(Object.keys(files)).toEqual([
      "1080x1920/en/auth-login--phone--ios--light.png",
      "1920x1080/ru/auth-login--phone--ios--light.png",
    ]);
  });

  it("keeps colliding filenames and flattens unsafe path segments", async () => {
    const files = await entries({ images }, [
      shot({ caseId: "../auth/login", languageCode: "../en" }),
      shot({ id: "s2", caseId: "auth-login" }),
      shot({ id: "s3", caseId: "auth-login", theme: "dark" }),
      shot({ id: "s4", caseId: "auth-login", platform: "android" }),
    ]);
    expect(Object.keys(files)).toEqual([
      "1080x1920/en/auth-login--phone--ios--light.png",
      "1080x1920/en/auth-login--phone--ios--light--2.png",
      "1080x1920/en/auth-login--phone--ios--dark.png",
      "1080x1920/en/auth-login--phone--android--light.png",
    ]);
  });

  it("converts WebP to PNG at its original decoded size and releases the bitmap", async () => {
    const bitmap = { width: 1080, height: 1920, close: vi.fn() };
    const decode = vi.fn().mockResolvedValue(bitmap);
    vi.stubGlobal("createImageBitmap", decode);
    const drawImage = vi.fn();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      drawImage,
    } as unknown as CanvasRenderingContext2D);
    const encode = vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(function (
      this: HTMLCanvasElement,
      callback,
    ) {
      expect(this.width).toBe(1080);
      expect(this.height).toBe(1920);
      callback(new Blob([png], { type: "image/png" }));
    });
    const files = await entries({ images: [{ ...images[0], format: "webp" }] }, [shot()]);
    expect(Object.values(files)[0]).toEqual(png);
    expect(drawImage).toHaveBeenCalledWith(bitmap, 0, 0);
    expect(encode).toHaveBeenCalledWith(expect.any(Function), "image/png");
    expect(bitmap.close).toHaveBeenCalledOnce();
  });

  it("fails for missing images rather than producing an incomplete archive", async () => {
    await expect(
      buildScreenshotsZip({ images }, [shot()], { urls: new Map(), thumbs: () => new Map() }),
    ).rejects.toThrow("missing");
    await expect(buildScreenshotsZip({ images: [] }, [shot()], archive())).rejects.toThrow(
      "missing",
    );
    await expect(buildScreenshotsZip({ images }, [], archive())).rejects.toThrow("No screenshots");
    fetchImage.mockResolvedValueOnce(new Response(null, { status: 404 }));
    await expect(buildScreenshotsZip({ images }, [shot()], archive())).rejects.toThrow(
      "Could not read",
    );
  });
});

it("starts a browser download and releases its temporary URL after the browser can read it", () => {
  vi.useFakeTimers();
  const create = vi.fn(() => "blob:download");
  const revoke = vi.fn();
  vi.stubGlobal("URL", { createObjectURL: create, revokeObjectURL: revoke });
  const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    expect(this.download).toBe("screenshots-run-1.zip");
    expect(this.href).toBe("blob:download");
    expect(this.isConnected).toBe(true);
  });
  saveScreenshotsZip(new Blob(), "run-1");
  expect(click).toHaveBeenCalledOnce();
  expect(document.querySelector("a[download]")).toBeNull();
  expect(revoke).not.toHaveBeenCalled();
  vi.runAllTimers();
  expect(revoke).toHaveBeenCalledWith("blob:download");
});
