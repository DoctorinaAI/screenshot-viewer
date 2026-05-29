import { createEffect, onCleanup, Show } from "solid-js";
import type { Shot } from "@/features/runs/manifest-helpers";
import type { ImagesArchive } from "@/shared/api/storage";
import type { Manifest } from "@/shared/lib/schema";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/shared/ui/dialog";

interface Props {
  manifest: Manifest;
  archive: ImagesArchive | null;
  shots: Shot[];
  index: number | null;
  onChangeIndex: (next: number | null) => void;
}

function ShotLightbox(props: Props) {
  const open = () => props.index !== null;
  const current = () => (props.index !== null ? (props.shots[props.index] ?? null) : null);
  const url = () => {
    const shot = current();
    if (!shot) return null;
    return props.archive?.urls.get(shot.imageHash) ?? null;
  };
  const meta = () => {
    const shot = current();
    if (!shot) return null;
    const c = props.manifest.cases.find((x) => x.id === shot.caseId);
    const layout = props.manifest.layouts.find((x) => x.id === shot.layoutId);
    const lang = props.manifest.languages.find((x) => x.code === shot.languageCode);
    return { shot, case: c, layout, lang };
  };

  function step(delta: number) {
    if (props.index === null) return;
    const next = props.index + delta;
    if (next < 0 || next >= props.shots.length) return;
    props.onChangeIndex(next);
  }

  createEffect(() => {
    if (!open()) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "ArrowRight") step(+1);
    };
    window.addEventListener("keydown", handler);
    onCleanup(() => window.removeEventListener("keydown", handler));
  });

  return (
    <Dialog
      open={open()}
      onOpenChange={(next) => {
        if (!next) props.onChangeIndex(null);
      }}
    >
      <DialogContent class="max-w-5xl">
        <Show when={meta()}>
          {(m) => (
            <div class="grid gap-3">
              <DialogTitle class="flex flex-wrap items-center gap-2 text-base">
                <span>{m().case?.title ?? m().shot.caseId}</span>
                <Badge variant="secondary" class="text-[11px]">
                  {m().lang?.name ?? m().shot.languageCode}
                </Badge>
                <Badge variant="outline" class="text-[11px]">
                  {m().layout?.name ?? m().shot.layoutId}
                </Badge>
                <Badge variant="outline" class="text-[11px]">
                  {m().shot.platform}
                </Badge>
              </DialogTitle>
              <div class="relative grid place-items-center rounded-md bg-muted">
                <Show
                  when={url()}
                  fallback={<p class="py-12 text-sm text-muted-foreground">Loading image…</p>}
                >
                  <img
                    src={url() ?? ""}
                    alt={m().case?.title ?? m().shot.caseId}
                    class="max-h-[70vh] w-auto object-contain"
                  />
                </Show>
              </div>
              <div class="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {(props.index ?? 0) + 1} / {props.shots.length}
                </span>
                <div class="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={props.index === 0}
                    onClick={() => step(-1)}
                  >
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={props.index === props.shots.length - 1}
                    onClick={() => step(+1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Show>
      </DialogContent>
    </Dialog>
  );
}

export { ShotLightbox };
