import { zip } from "fflate";
import type { Shot } from "@/features/runs/manifest-helpers";
import type { ImagesArchive } from "@/shared/api/storage";
import type { Manifest } from "@/shared/lib/schema";

function fileSegment(value: string): string {
  return (
    value
      .replace(/[^\p{L}\p{N}._-]+/gu, "-")
      .replace(/^[.-]+|[.-]+$/g, "")
      .slice(0, 120) || "screenshot"
  );
}

async function pngBytes(
  url: string,
  format: Manifest["images"][number]["format"],
): Promise<Uint8Array> {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Could not read a screenshot from the image archive.");
  if (format === "png") return new Uint8Array(await response.arrayBuffer());

  // Storage can contain WebP images. Decode at the original size so every
  // exported file is a real PNG rather than a renamed WebP or a thumbnail.
  const bitmap = await createImageBitmap(await response.blob());
  try {
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Could not convert a screenshot to PNG.");
    context.drawImage(bitmap, 0, 0);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => {
        if (result) resolve(result);
        else reject(new Error("Could not convert a screenshot to PNG."));
      }, "image/png");
    });
    return new Uint8Array(await blob.arrayBuffer());
  } finally {
    bitmap.close();
  }
}

/** Build one PNG per selected shot, including shots that share image bytes. */
export async function buildScreenshotsZip(
  manifest: Pick<Manifest, "images">,
  shots: readonly Shot[],
  archive: ImagesArchive,
): Promise<Blob> {
  if (shots.length === 0) throw new Error("No screenshots match the active filters.");
  const images = new Map(manifest.images.map((image) => [image.hash, image]));
  const pngs = new Map<string, Uint8Array>();
  const files: Record<string, Uint8Array> = {};

  for (const shot of shots) {
    const image = images.get(shot.imageHash);
    const url = archive.urls.get(shot.imageHash);
    if (!image || !url) throw new Error(`Screenshot is missing from the image archive: ${shot.id}`);
    let data = pngs.get(shot.imageHash);
    if (!data) {
      data = await pngBytes(url, image.format);
      pngs.set(shot.imageHash, data);
    }
    const folder = `${image.width}x${image.height}/${fileSegment(shot.languageCode)}`;
    const name =
      `${fileSegment(shot.caseId)}--${fileSegment(shot.layoutId)}--${shot.platform}--${shot.theme}`.slice(
        0,
        180,
      );
    let path = `${folder}/${name}.png`;
    let suffix = 2;
    while (Object.hasOwn(files, path)) {
      path = `${folder}/${name}--${suffix++}.png`;
    }
    files[path] = data;
  }

  // PNGs are already compressed. Store them without recompression to keep
  // large exports quick and avoid creating a worker per screenshot.
  return new Promise((resolve, reject) => {
    zip(files, { level: 0 }, (error, data) => {
      if (error) reject(error);
      else resolve(new Blob([new Uint8Array(data)], { type: "application/zip" }));
    });
  });
}

export function saveScreenshotsZip(blob: Blob, runId: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `screenshots-${fileSegment(runId)}.zip`;
  link.hidden = true;
  document.body.append(link);
  try {
    link.click();
  } finally {
    link.remove();
    // Give the browser time to start reading before revoking the download URL.
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }
}
