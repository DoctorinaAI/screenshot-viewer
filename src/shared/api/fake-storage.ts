// Fake Cloud Storage. Replaces fflate unzip + Firebase getBlob with
// synthetic PNGs rendered on-canvas. Each (case, layout, lang, theme) tuple
// gets a deterministic 360-wide screenshot featuring the case title plus a
// FAKE watermark, colored by a deterministic hash so failed runs stand out.
//
// The returned ImagesArchive looks exactly like the real one (urls Map +
// thumbs signal accessor), so shot-grid / shot-lightbox don't know the
// difference. Thumbs are generated synchronously in this path (each shot is
// cheap to render), then mirrored into the same signal-backed Map the real
// pipeline uses.

import { createSignal } from "solid-js";
import { buildFakeManifest } from "@/shared/api/fake-data";
import type { ImagesArchive } from "@/shared/api/storage";
import type { Manifest } from "@/shared/lib/schema";

const FAKE_PATH_RE = /\/runs\/([^/]+)\/(manifest\.json|images\.zip)$/;

function runIdFromUrl(gsUrl: string): string {
  const m = FAKE_PATH_RE.exec(gsUrl);
  if (!m) throw new Error(`fake storage: unrecognized path ${gsUrl}`);
  return m[1];
}

export async function fakeFetchManifest(gsUrl: string): Promise<Manifest> {
  const runId = runIdFromUrl(gsUrl);
  await delay(80);
  const manifest = buildFakeManifest(runId);
  if (!manifest) throw new Error(`fake storage: no manifest for run ${runId}`);
  return manifest;
}

interface ShotMetaForRender {
  caseTitle: string;
  caseId: string;
  languageCode: string;
  languageName: string;
  layoutName: string;
  status: "ok" | "warning" | "failed";
}

export async function fakeFetchImagesArchive(
  gsUrl: string,
  manifest: Manifest,
): Promise<ImagesArchive> {
  const runId = runIdFromUrl(gsUrl);
  void runId;
  await delay(200);

  const casesById = new Map(manifest.cases.map((c) => [c.id, c] as const));
  const langsByCode = new Map(manifest.languages.map((l) => [l.code, l] as const));
  const layoutsById = new Map(manifest.layouts.map((l) => [l.id, l] as const));

  // Pick the first shot per hash to drive rendering (shots that share a hash
  // are visually identical by definition).
  const firstShotByHash = new Map<string, (typeof manifest.shots)[number]>();
  for (const shot of manifest.shots) {
    if (!firstShotByHash.has(shot.imageHash)) firstShotByHash.set(shot.imageHash, shot);
  }

  const urls = new Map<string, string>();
  const thumbsMap = new Map<string, string>();
  for (const image of manifest.images) {
    const shot = firstShotByHash.get(image.hash);
    if (!shot) continue;
    const c = casesById.get(shot.caseId);
    const lang = langsByCode.get(shot.languageCode);
    const layout = layoutsById.get(shot.layoutId);
    if (!c || !lang || !layout) continue;
    const meta: ShotMetaForRender = {
      caseTitle: c.title,
      caseId: c.id,
      languageCode: lang.code,
      languageName: lang.name,
      layoutName: layout.name,
      status: shot.status,
    };
    const fullBlob = await renderShotPng(
      meta,
      Math.min(image.width, 480),
      Math.min(image.height, 720),
    );
    const thumbBlob = await renderShotPng(meta, 240, 360);
    urls.set(image.hash, URL.createObjectURL(fullBlob));
    thumbsMap.set(image.hash, URL.createObjectURL(thumbBlob));
  }

  const [thumbs] = createSignal<Map<string, string>>(thumbsMap);
  return { urls, thumbs };
}

async function renderShotPng(
  meta: ShotMetaForRender,
  width: number,
  height: number,
): Promise<Blob> {
  if (typeof OffscreenCanvas !== "undefined") {
    const canvas = new OffscreenCanvas(width, height);
    paint(canvas as unknown as HTMLCanvasElement, meta, width, height);
    return await canvas.convertToBlob({ type: "image/png" });
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  paint(canvas, meta, width, height);
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("canvas.toBlob returned null"))),
      "image/png",
    );
  });
}

function paint(
  canvas: HTMLCanvasElement,
  meta: ShotMetaForRender,
  width: number,
  height: number,
): void {
  const ctx = canvas.getContext("2d") as
    | CanvasRenderingContext2D
    | OffscreenCanvasRenderingContext2D
    | null;
  if (!ctx) return;
  const palette = palettes[hash(meta.caseId + meta.languageCode) % palettes.length];
  const top = meta.status === "failed" ? "#c0392b" : palette.top;
  const bottom = meta.status === "failed" ? "#7e2120" : palette.bottom;

  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, top);
  gradient.addColorStop(1, bottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Status bar mockup
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.fillRect(0, 0, width, Math.max(18, height * 0.05));

  // Body card
  const margin = Math.round(width * 0.06);
  const cardX = margin;
  const cardY = Math.round(height * 0.18);
  const cardW = width - margin * 2;
  const cardH = Math.round(height * 0.7);
  ctx.fillStyle = "rgba(255,255,255,0.94)";
  roundRect(ctx, cardX, cardY, cardW, cardH, Math.round(width * 0.04));
  ctx.fill();

  // Header lines inside card
  ctx.fillStyle = "#1c1c1c";
  ctx.font = `bold ${Math.round(width * 0.07)}px system-ui, sans-serif`;
  ctx.fillText(
    truncate(meta.caseTitle, 22),
    cardX + Math.round(width * 0.05),
    cardY + Math.round(width * 0.13),
  );

  ctx.fillStyle = "#666";
  ctx.font = `${Math.round(width * 0.04)}px system-ui, sans-serif`;
  ctx.fillText(
    `${meta.languageName} (${meta.languageCode}) · ${meta.layoutName}`,
    cardX + Math.round(width * 0.05),
    cardY + Math.round(width * 0.22),
  );

  // Skeleton lines for body
  ctx.fillStyle = "#e2e8f0";
  for (let i = 0; i < 5; i++) {
    const y = cardY + Math.round(width * 0.32) + i * Math.round(width * 0.09);
    const w = cardW - Math.round(width * 0.1) - (i % 2 === 0 ? 0 : Math.round(width * 0.18));
    roundRect(
      ctx,
      cardX + Math.round(width * 0.05),
      y,
      w,
      Math.round(width * 0.05),
      Math.round(width * 0.015),
    );
    ctx.fill();
  }

  // CTA button
  ctx.fillStyle = palette.cta;
  const btnY = cardY + cardH - Math.round(width * 0.18);
  roundRect(
    ctx,
    cardX + Math.round(width * 0.05),
    btnY,
    cardW - Math.round(width * 0.1),
    Math.round(width * 0.12),
    Math.round(width * 0.04),
  );
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${Math.round(width * 0.05)}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText(
    callToActionLabel(meta.languageCode),
    cardX + cardW / 2,
    btnY + Math.round(width * 0.08),
  );
  ctx.textAlign = "start";

  // FAKE watermark
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate(-Math.PI / 8);
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.font = `bold ${Math.round(width * 0.28)}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText("FAKE", 0, 0);
  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function truncate(s: string, n: number): string {
  return s.length <= n ? s : `${s.slice(0, n - 1)}…`;
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const palettes = [
  { top: "#3b82f6", bottom: "#1e40af", cta: "#2563eb" },
  { top: "#10b981", bottom: "#047857", cta: "#059669" },
  { top: "#f59e0b", bottom: "#b45309", cta: "#d97706" },
  { top: "#8b5cf6", bottom: "#5b21b6", cta: "#7c3aed" },
  { top: "#ec4899", bottom: "#9d174d", cta: "#db2777" },
] as const;

function callToActionLabel(code: string): string {
  switch (code) {
    case "ru":
      return "Продолжить";
    case "es":
      return "Continuar";
    default:
      return "Continue";
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function fakeReleaseImages(archive: ImagesArchive): void {
  for (const url of archive.urls.values()) URL.revokeObjectURL(url);
  for (const url of archive.thumbs().values()) URL.revokeObjectURL(url);
  archive.urls.clear();
}
