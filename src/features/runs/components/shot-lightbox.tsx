import { createEffect, createSignal, onCleanup, Show } from "solid-js";
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
  // Side-by-side diff state: indices into props.shots that the user pinned
  // via the `1` and `2` keys. `null` means that pane isn't pinned yet.
  const [leftIndex, setLeftIndex] = createSignal<number | null>(null);
  const [rightIndex, setRightIndex] = createSignal<number | null>(null);
  const both = () => leftIndex() !== null && rightIndex() !== null;

  const shotAt = (i: number | null) => (i === null ? null : (props.shots[i] ?? null));
  const urlFor = (shot: Shot | null) => {
    if (!shot) return null;
    return props.archive?.urls.get(shot.imageHash) ?? null;
  };

  const current = () => shotAt(props.index);
  const url = () => urlFor(current());

  const meta = (shot: Shot | null) => {
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

  function clearDiff() {
    setLeftIndex(null);
    setRightIndex(null);
  }

  createEffect(() => {
    if (!open()) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "ArrowRight") step(+1);
      else if (e.key === "1" && props.index !== null) setLeftIndex(props.index);
      else if (e.key === "2" && props.index !== null) setRightIndex(props.index);
      else if (e.key === "0" || e.key === "Backspace") clearDiff();
    };
    window.addEventListener("keydown", handler);
    onCleanup(() => window.removeEventListener("keydown", handler));
  });

  // Reset diff when the lightbox closes.
  createEffect(() => {
    if (!open()) clearDiff();
  });

  return (
    <Dialog
      open={open()}
      onOpenChange={(next) => {
        if (!next) props.onChangeIndex(null);
      }}
    >
      <DialogContent class="max-w-6xl">
        <Show when={meta(current())}>
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
                <Show when={leftIndex() !== null && leftIndex() === props.index}>
                  <Badge variant="ok" class="text-[11px]">
                    pinned 1
                  </Badge>
                </Show>
                <Show when={rightIndex() !== null && rightIndex() === props.index}>
                  <Badge variant="warning" class="text-[11px]">
                    pinned 2
                  </Badge>
                </Show>
              </DialogTitle>

              <Show
                when={both()}
                fallback={
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
                }
              >
                <DiffPanes
                  left={shotAt(leftIndex())}
                  right={shotAt(rightIndex())}
                  leftUrl={urlFor(shotAt(leftIndex()))}
                  rightUrl={urlFor(shotAt(rightIndex()))}
                  manifest={props.manifest}
                />
              </Show>

              <div class="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                <span>
                  {(props.index ?? 0) + 1} / {props.shots.length}
                  <Show when={leftIndex() !== null || rightIndex() !== null}>
                    <span class="ml-3 font-mono">
                      diff: {leftIndex() !== null ? `#${(leftIndex() ?? 0) + 1}` : "—"} /{" "}
                      {rightIndex() !== null ? `#${(rightIndex() ?? 0) + 1}` : "—"}
                    </span>
                  </Show>
                </span>
                <div class="flex flex-wrap gap-2">
                  <kbd class="rounded border px-1.5 py-0.5 font-mono text-[10px]">←</kbd>
                  <kbd class="rounded border px-1.5 py-0.5 font-mono text-[10px]">→</kbd>
                  <span class="text-muted-foreground/70">·</span>
                  <kbd class="rounded border px-1.5 py-0.5 font-mono text-[10px]">1</kbd>
                  <kbd class="rounded border px-1.5 py-0.5 font-mono text-[10px]">2</kbd>
                  <span class="text-muted-foreground/70">pin diff</span>
                  <span class="text-muted-foreground/70">·</span>
                  <kbd class="rounded border px-1.5 py-0.5 font-mono text-[10px]">0</kbd>
                  <span class="text-muted-foreground/70">clear</span>
                </div>
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

interface DiffPanesProps {
  left: Shot | null;
  right: Shot | null;
  leftUrl: string | null;
  rightUrl: string | null;
  manifest: Manifest;
}

function DiffPanes(props: DiffPanesProps) {
  return (
    <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
      <DiffPane
        label="1"
        badgeVariant="ok"
        shot={props.left}
        url={props.leftUrl}
        manifest={props.manifest}
      />
      <DiffPane
        label="2"
        badgeVariant="warning"
        shot={props.right}
        url={props.rightUrl}
        manifest={props.manifest}
      />
    </div>
  );
}

interface DiffPaneProps {
  label: string;
  badgeVariant: "ok" | "warning";
  shot: Shot | null;
  url: string | null;
  manifest: Manifest;
}

function DiffPane(props: DiffPaneProps) {
  const lang = () =>
    props.shot
      ? props.manifest.languages.find((x) => x.code === props.shot?.languageCode)
      : undefined;
  const layout = () =>
    props.shot ? props.manifest.layouts.find((x) => x.id === props.shot?.layoutId) : undefined;

  return (
    <figure class="grid gap-2">
      <figcaption class="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
        <Badge variant={props.badgeVariant} class="px-1.5 py-0 text-[10px]">
          {props.label}
        </Badge>
        <Show when={props.shot} fallback={<span>Pin a shot to compare</span>}>
          <span>{lang()?.code ?? props.shot?.languageCode}</span>
          <span>·</span>
          <span>{layout()?.name ?? props.shot?.layoutId}</span>
        </Show>
      </figcaption>
      <div class="grid place-items-center rounded-md bg-muted">
        <Show
          when={props.url}
          fallback={<p class="py-12 text-xs text-muted-foreground">No image</p>}
        >
          <img
            src={props.url ?? ""}
            alt={`Pane ${props.label}`}
            class="max-h-[60vh] w-auto object-contain"
          />
        </Show>
      </div>
    </figure>
  );
}

export { ShotLightbox };
