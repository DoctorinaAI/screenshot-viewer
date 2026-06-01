import { createEffect, createSignal, onCleanup, Show } from "solid-js";
import type { Shot } from "@/features/runs/manifest-helpers";
import type { ManifestIndex } from "@/features/runs/run-store";
import type { ImagesArchive } from "@/shared/api/storage";
import { useT } from "@/shared/lib/i18n";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/shared/ui/dialog";

interface Props {
  index: ManifestIndex | null;
  archive: ImagesArchive | null;
  shots: Shot[];
  shotIndex: number | null;
  onChangeIndex: (next: number | null) => void;
}

/**
 * Diff is driven by keys `1` (pin left) / `2` (pin right) / `3` (clear).
 * `3` replaced `0` so the cluster sits next to the pin keys; the clickable
 * Pin/Clear buttons make this discoverable without the keyboard. Backspace
 * still clears as a friendly extra.
 */
function ShotLightbox(props: Props) {
  const t = useT();
  const open = () => props.shotIndex !== null;
  const [leftIndex, setLeftIndex] = createSignal<number | null>(null);
  const [rightIndex, setRightIndex] = createSignal<number | null>(null);
  const both = () => leftIndex() !== null && rightIndex() !== null;

  const shotAt = (i: number | null) => (i === null ? null : (props.shots[i] ?? null));
  const urlFor = (shot: Shot | null) => {
    if (!shot) return null;
    return props.archive?.urls.get(shot.imageHash) ?? null;
  };

  const current = () => shotAt(props.shotIndex);
  const url = () => urlFor(current());

  const meta = (shot: Shot | null) => {
    if (!shot) return null;
    const idx = props.index;
    return {
      shot,
      case: idx?.cases.get(shot.caseId),
      layout: idx?.layouts.get(shot.layoutId),
      lang: idx?.languages.get(shot.languageCode),
    };
  };

  function step(delta: number) {
    if (props.shotIndex === null) return;
    const next = props.shotIndex + delta;
    if (next < 0 || next >= props.shots.length) return;
    props.onChangeIndex(next);
  }

  function pinLeft() {
    if (props.shotIndex !== null) setLeftIndex(props.shotIndex);
  }
  function pinRight() {
    if (props.shotIndex !== null) setRightIndex(props.shotIndex);
  }
  function clearDiff() {
    setLeftIndex(null);
    setRightIndex(null);
  }

  createEffect(() => {
    if (!open()) return;
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement) {
        const tag = e.target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
      }
      if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "ArrowRight") step(+1);
      else if (e.key === "1") pinLeft();
      else if (e.key === "2") pinRight();
      else if (e.key === "3" || e.key === "Backspace") clearDiff();
    };
    window.addEventListener("keydown", handler);
    onCleanup(() => window.removeEventListener("keydown", handler));
  });

  // Reset diff when the lightbox closes.
  createEffect(() => {
    if (!open()) clearDiff();
  });

  const leftPinned = () => leftIndex() !== null && leftIndex() === props.shotIndex;
  const rightPinned = () => rightIndex() !== null && rightIndex() === props.shotIndex;

  return (
    <Dialog
      open={open()}
      onOpenChange={(next) => {
        if (!next) props.onChangeIndex(null);
      }}
    >
      <DialogContent class="w-[min(72rem,calc(100vw-1.5rem))] max-w-none">
        <Show when={meta(current())}>
          {(m) => (
            <div class="grid gap-3">
              <DialogTitle class="flex min-w-0 flex-wrap items-center gap-2 text-base">
                <span class="min-w-0 truncate">{m().case?.title ?? m().shot.caseId}</span>
                <Badge variant="secondary" class="text-[11px]">
                  {m().lang?.name ?? m().shot.languageCode}
                </Badge>
                <Badge variant="outline" class="text-[11px]">
                  {m().layout?.name ?? m().shot.layoutId}
                </Badge>
                <Badge variant="outline" class="text-[11px]">
                  {m().shot.platform}
                </Badge>
                <Show when={leftPinned()}>
                  <Badge variant="ok" class="text-[11px]">
                    1
                  </Badge>
                </Show>
                <Show when={rightPinned()}>
                  <Badge variant="warning" class="text-[11px]">
                    2
                  </Badge>
                </Show>
              </DialogTitle>

              <Show
                when={both()}
                fallback={
                  <div class="relative grid place-items-center rounded-md bg-muted">
                    <Show
                      when={url()}
                      fallback={
                        <p class="py-12 text-sm text-muted-foreground">{t("lightbox.loading")}</p>
                      }
                    >
                      <img
                        src={url() ?? ""}
                        alt={m().case?.title ?? m().shot.caseId}
                        decoding="async"
                        draggable={false}
                        class="max-h-[70vh] w-auto select-none object-contain"
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
                  index={props.index}
                />
              </Show>

              <div class="grid gap-3">
                {/* Diff controls (clickable buttons mirroring the keyboard). */}
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <div class="flex flex-wrap items-center gap-1.5">
                    <Button
                      type="button"
                      variant={leftPinned() ? "default" : "outline"}
                      size="sm"
                      class="h-8 select-none gap-1.5"
                      onClick={pinLeft}
                      aria-pressed={leftPinned()}
                    >
                      <Badge variant="ok" class="px-1.5 py-0 text-[10px]">
                        1
                      </Badge>
                      <span>{t("lightbox.pin1")}</span>
                    </Button>
                    <Button
                      type="button"
                      variant={rightPinned() ? "default" : "outline"}
                      size="sm"
                      class="h-8 select-none gap-1.5"
                      onClick={pinRight}
                      aria-pressed={rightPinned()}
                    >
                      <Badge variant="warning" class="px-1.5 py-0 text-[10px]">
                        2
                      </Badge>
                      <span>{t("lightbox.pin2")}</span>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      class="h-8 select-none gap-1.5"
                      onClick={clearDiff}
                      disabled={leftIndex() === null && rightIndex() === null}
                    >
                      <Badge variant="outline" class="px-1.5 py-0 text-[10px]">
                        3
                      </Badge>
                      <span>{t("lightbox.clearDiff")}</span>
                    </Button>
                  </div>
                  <div class="flex shrink-0 gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      class="h-8 select-none"
                      disabled={props.shotIndex === 0}
                      onClick={() => step(-1)}
                      aria-label={t("common.previous")}
                    >
                      <ChevronLeft />
                      <span class="hidden sm:inline">{t("common.previous")}</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      class="h-8 select-none"
                      disabled={props.shotIndex === props.shots.length - 1}
                      onClick={() => step(+1)}
                      aria-label={t("common.next")}
                    >
                      <span class="hidden sm:inline">{t("common.next")}</span>
                      <ChevronRight />
                    </Button>
                  </div>
                </div>

                {/* Status row + keyboard legend. */}
                <div class="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                  <span class="select-none">
                    {(props.shotIndex ?? 0) + 1} / {props.shots.length}
                    <Show when={leftIndex() !== null || rightIndex() !== null}>
                      <span class="ml-3 font-mono">
                        {leftIndex() !== null ? `#${(leftIndex() ?? 0) + 1}` : "—"} /{" "}
                        {rightIndex() !== null ? `#${(rightIndex() ?? 0) + 1}` : "—"}
                      </span>
                    </Show>
                  </span>
                  <div class="hidden flex-wrap items-center gap-1.5 md:flex">
                    <Kbd>←</Kbd>
                    <Kbd>→</Kbd>
                    <span class="text-muted-foreground/70">·</span>
                    <Kbd>1</Kbd>
                    <Kbd>2</Kbd>
                    <span class="select-none text-muted-foreground/70">
                      {t("lightbox.diffHint")}
                    </span>
                    <span class="text-muted-foreground/70">·</span>
                    <Kbd>3</Kbd>
                    <span class="select-none text-muted-foreground/70">
                      {t("lightbox.clearHint")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Show>
      </DialogContent>
    </Dialog>
  );
}

function Kbd(props: { children: import("solid-js").JSX.Element }) {
  return (
    <kbd class="select-none rounded border px-1.5 py-0.5 font-mono text-[10px]">
      {props.children}
    </kbd>
  );
}

function ChevronLeft() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="h-4 w-4"
      aria-hidden="true"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="h-4 w-4"
      aria-hidden="true"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

interface DiffPanesProps {
  left: Shot | null;
  right: Shot | null;
  leftUrl: string | null;
  rightUrl: string | null;
  index: ManifestIndex | null;
}

function DiffPanes(props: DiffPanesProps) {
  return (
    <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
      <DiffPane
        label="1"
        badgeVariant="ok"
        shot={props.left}
        url={props.leftUrl}
        index={props.index}
      />
      <DiffPane
        label="2"
        badgeVariant="warning"
        shot={props.right}
        url={props.rightUrl}
        index={props.index}
      />
    </div>
  );
}

interface DiffPaneProps {
  label: string;
  badgeVariant: "ok" | "warning";
  shot: Shot | null;
  url: string | null;
  index: ManifestIndex | null;
}

function DiffPane(props: DiffPaneProps) {
  const t = useT();
  const lang = () => (props.shot ? props.index?.languages.get(props.shot.languageCode) : undefined);
  const layout = () => (props.shot ? props.index?.layouts.get(props.shot.layoutId) : undefined);

  return (
    <figure class="grid gap-2">
      <figcaption class="flex min-w-0 flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
        <Badge variant={props.badgeVariant} class="px-1.5 py-0 text-[10px]">
          {props.label}
        </Badge>
        <Show when={props.shot} fallback={<span>{t("lightbox.pinShot")}</span>}>
          <span class="truncate">{lang()?.code ?? props.shot?.languageCode}</span>
          <span>·</span>
          <span class="truncate">{layout()?.name ?? props.shot?.layoutId}</span>
        </Show>
      </figcaption>
      <div class="grid place-items-center rounded-md bg-muted">
        <Show
          when={props.url}
          fallback={<p class="py-12 text-xs text-muted-foreground">{t("lightbox.noImage")}</p>}
        >
          <img
            src={props.url ?? ""}
            alt={`${t("lightbox.pin1")} ${props.label}`}
            decoding="async"
            draggable={false}
            class="max-h-[60vh] w-auto select-none object-contain"
          />
        </Show>
      </div>
    </figure>
  );
}

export { ShotLightbox };
