import { createSignal, onCleanup, Show } from "solid-js";
import { buildScreenshotsZip, saveScreenshotsZip } from "@/features/runs/download-screenshots";
import type { Shot } from "@/features/runs/manifest-helpers";
import type { ImagesArchive } from "@/shared/api/storage";
import { useT } from "@/shared/lib/i18n";
import type { Manifest } from "@/shared/lib/schema";
import { Button } from "@/shared/ui/button";

interface DownloadScreenshotsButtonProps {
  manifest: Manifest;
  shots: Shot[];
  ensureArchive: () => Promise<ImagesArchive | null>;
}

export function DownloadScreenshotsButton(props: DownloadScreenshotsButtonProps) {
  const t = useT();
  const [downloading, setDownloading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  let disposed = false;
  onCleanup(() => {
    disposed = true;
  });

  const download = async () => {
    if (downloading() || props.shots.length === 0) return;
    const manifest = props.manifest;
    const shots = [...props.shots];
    const isCurrent = () => !disposed && props.manifest === manifest;
    setDownloading(true);
    setError(null);
    try {
      const archive = await props.ensureArchive();
      if (!isCurrent()) return;
      if (!archive) throw new Error(t("run.download.archiveFailed"));
      const blob = await buildScreenshotsZip(manifest, shots, archive);
      if (isCurrent()) saveScreenshotsZip(blob, manifest.runId);
    } catch (err) {
      if (isCurrent()) setError(err instanceof Error ? err.message : String(err));
    } finally {
      if (!disposed) setDownloading(false);
    }
  };

  return (
    <div class="grid gap-2">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p class="text-xs text-muted-foreground">{t("run.download.structure")}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          class="w-full select-none sm:w-auto"
          disabled={downloading() || props.shots.length === 0}
          aria-busy={downloading()}
          onClick={() => void download()}
        >
          <Show when={!downloading()} fallback={t("run.download.preparing")}>
            {t("run.download.label", { n: props.shots.length })}
          </Show>
        </Button>
      </div>
      <Show when={error()}>
        {(message) => (
          <p role="alert" class="text-sm text-destructive">
            {t("run.download.failed", { message: message() })}
          </p>
        )}
      </Show>
    </div>
  );
}
