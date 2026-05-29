// Cloud Storage helpers. The viewer fetches two files per run:
//
//   gs://<bucket>/runs/<sha>/manifest.json    ~200-400 KB, parsed with Zod
//   gs://<bucket>/runs/<sha>/images.zip       ~50 MB, unzipped in browser via fflate
//
// Storage rules (firebase/storage.rules) only allow these two filenames under
// runs/, so this module never needs to enumerate paths.

import { unzipSync } from "fflate";
import { getBlob, ref } from "firebase/storage";
import { type Manifest, ManifestSchema } from "@/shared/lib/schema";
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
  const path = storagePathFromUrl(gsUrl);
  const blob = await getBlob(ref(firebaseStorage(), path));
  const text = await blob.text();
  const json = JSON.parse(text) as unknown;
  return ManifestSchema.parse(json);
}

export interface ImagesArchive {
  // Map from sha256 (manifest images[].hash) to a Blob URL ready for <img src="…">.
  // Caller owns lifetime: revoke each URL via `releaseImages()` on cleanup.
  urls: Map<string, string>;
}

export async function fetchImagesArchive(
  gsUrl: string,
  manifest: Manifest,
): Promise<ImagesArchive> {
  const path = storagePathFromUrl(gsUrl);
  const blob = await getBlob(ref(firebaseStorage(), path));
  const buffer = new Uint8Array(await blob.arrayBuffer());
  const files = unzipSync(buffer);

  // Walk manifest.images instead of zip entries so a hash that's referenced
  // by a shot but missing from the zip silently shows the placeholder rather
  // than crashing. Going through the manifest also lets the producer change
  // the in-zip layout without touching the viewer.
  const urls = new Map<string, string>();
  for (const image of manifest.images) {
    const data = files[image.filename];
    if (!data) continue;
    const mime = image.format === "webp" ? "image/webp" : "image/png";
    urls.set(image.hash, URL.createObjectURL(new Blob([data], { type: mime })));
  }
  return { urls };
}

export function releaseImages(archive: ImagesArchive): void {
  for (const url of archive.urls.values()) URL.revokeObjectURL(url);
  archive.urls.clear();
}
