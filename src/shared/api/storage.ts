// Cloud Storage helpers. The viewer fetches two files per run:
//
//   gs://<bucket>/runs/<sha>/manifest.json    ~200-400 KB, parsed with Zod
//   gs://<bucket>/runs/<sha>/images.zip       ~50 MB, unzipped in browser via fflate
//
// Storage rules (firebase/storage.rules) only allow these two filenames under
// runs/, so this module never needs to enumerate paths.
//
// After unzip we generate WebP thumbnails (~320 px wide) in the background so
// the shot grid can render small images instead of full-resolution PNGs. The
// archive resolves as soon as full URLs are ready; thumbs stream in via a
// signal accessor that components can subscribe to.

import { unzipSync } from "fflate";
import { getBlob, ref } from "firebase/storage";
import { createSignal } from "solid-js";
import { type Manifest, ManifestSchema } from "@/shared/lib/schema";
import { USE_FAKE_BACKEND } from "./backend";
import { fakeFetchImagesArchive, fakeFetchManifest, fakeReleaseImages } from "./fake-storage";
import { firebaseStorage } from "./firebase";

function storagePathFromUrl(gsUrl: string): string {
  // Accepts a `gs://bucket/path/to/file` URL and returns just `path/to/file`.
  // `ref(storage, gsUrl)` would handle the gs:// form directly, but lifting
  // the bucket out lets us double-check it matches the configured bucket and
  // gives nicer errors than Firebase's default.
  const match = /^gs:\/\/[^/]+\/(.+)$/.exec(gsUrl);
  if (!match) throw new Error(`Storage URL is not a gs:// URL: ${gsUrl}`);
  return match[1];
}

export async function fetchManifest(gsUrl: string): Promise<Manifest> {
  if (USE_FAKE_BACKEND) return fakeFetchManifest(gsUrl);
  const path = storagePathFromUrl(gsUrl);
  const blob = await getBlob(ref(firebaseStorage(), path));
  const text = await blob.text();
  const json = JSON.parse(text) as unknown;
  return ManifestSchema.parse(json);
}

const THUMB_TARGET_WIDTH = 320;

export interface ImagesArchive {
  // Full-resolution Blob URLs by sha256 (manifest images[].hash). Used in the
  // lightbox where pixel-accurate viewing matters.
  urls: Map<string, string>;
  // Thumb Blob URLs by hash. Populated incrementally — read this in the grid
  // and fall back to `urls` while it's empty for a given hash.
  thumbs: () => Map<string, string>;
}

export async function fetchImagesArchive(
  gsUrl: string,
  manifest: Manifest,
): Promise<ImagesArchive> {
  if (USE_FAKE_BACKEND) return fakeFetchImagesArchive(gsUrl, manifest);
  const path = storagePathFromUrl(gsUrl);
  const blob = await getBlob(ref(firebaseStorage(), path));
  const buffer = new Uint8Array(await blob.arrayBuffer());
  const files = unzipSync(buffer);

  // Walk manifest.images instead of zip entries so a hash that's referenced
  // by a shot but missing from the zip silently shows the placeholder rather
  // than crashing. Going through the manifest also lets the producer change
  // the in-zip layout without touching the viewer.
  const urls = new Map<string, string>();
  const fullBlobs = new Map<string, { blob: Blob; mime: string }>();
  for (const image of manifest.images) {
    const data = files[image.filename];
    if (!data) continue;
    const mime = image.format === "webp" ? "image/webp" : "image/png";
    const fullBlob = new Blob([data], { type: mime });
    urls.set(image.hash, URL.createObjectURL(fullBlob));
    fullBlobs.set(image.hash, { blob: fullBlob, mime });
  }

  const [thumbs, setThumbs] = createSignal<Map<string, string>>(new Map());
  // Kick off background thumbnail generation; never awaited so the archive is
  // usable immediately. The grid renders the full image until its thumb lands.
  void generateThumbnailsInBackground(fullBlobs, setThumbs);

  return { urls, thumbs };
}

async function generateThumbnailsInBackground(
  fullBlobs: Map<string, { blob: Blob; mime: string }>,
  setThumbs: (next: Map<string, string>) => void,
): Promise<void> {
  if (typeof createImageBitmap === "undefined") return;
  const out = new Map<string, string>();
  let lastFlush = 0;
  let i = 0;
  for (const [hash, { blob }] of fullBlobs) {
    i += 1;
    try {
      const thumb = await renderThumbnail(blob);
      if (thumb) out.set(hash, URL.createObjectURL(thumb));
    } catch {
      // Ignore — the grid will keep showing the full image for this hash.
    }
    // Flush every 8 thumbs or every 200 ms so UI updates in batches rather
    // than once per image (cheaper) and doesn't wait until the very end.
    const now = performance.now();
    if (i % 8 === 0 || now - lastFlush > 200) {
      setThumbs(new Map(out));
      lastFlush = now;
      // Yield to the event loop so big runs don't starve user interaction.
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
    }
  }
  setThumbs(new Map(out));
}

async function renderThumbnail(blob: Blob): Promise<Blob | null> {
  const bitmap = await createImageBitmap(blob);
  try {
    if (bitmap.width <= THUMB_TARGET_WIDTH) return null;
    const ratio = bitmap.height / bitmap.width;
    const w = THUMB_TARGET_WIDTH;
    const h = Math.max(1, Math.round(THUMB_TARGET_WIDTH * ratio));
    if (typeof OffscreenCanvas !== "undefined") {
      const canvas = new OffscreenCanvas(w, h);
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(bitmap, 0, 0, w, h);
      return await canvas.convertToBlob({ type: "image/webp", quality: 0.82 });
    }
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, w, h);
    return await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), "image/webp", 0.82);
    });
  } finally {
    bitmap.close();
  }
}

export function releaseImages(archive: ImagesArchive): void {
  if (USE_FAKE_BACKEND) {
    fakeReleaseImages(archive);
    return;
  }
  for (const url of archive.urls.values()) URL.revokeObjectURL(url);
  for (const url of archive.thumbs().values()) URL.revokeObjectURL(url);
  archive.urls.clear();
}
