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
  // Raw bytes per hash, in case anything downstream needs them directly.
  bytes: Map<string, Uint8Array>;
}

export async function fetchImagesArchive(
  gsUrl: string,
  manifest: Manifest,
): Promise<ImagesArchive> {
  const path = storagePathFromUrl(gsUrl);
  const blob = await getBlob(ref(firebaseStorage(), path));
  const buffer = new Uint8Array(await blob.arrayBuffer());
  const files = unzipSync(buffer);

  // Build hash → bytes via the manifest's images[].filename lookup. The zip
  // stores files at `images/<hash>.<ext>`, but going through the manifest is
  // safer in case the writer ever changes the in-zip layout.
  const bytes = new Map<string, Uint8Array>();
  const urls = new Map<string, string>();
  for (const image of manifest.images) {
    const data = files[image.filename];
    if (!data) continue;
    bytes.set(image.hash, data);
    const mime = image.format === "webp" ? "image/webp" : "image/png";
    urls.set(image.hash, URL.createObjectURL(new Blob([data], { type: mime })));
  }
  return { urls, bytes };
}

export function releaseImages(archive: ImagesArchive): void {
  for (const url of archive.urls.values()) URL.revokeObjectURL(url);
  archive.urls.clear();
  archive.bytes.clear();
}
