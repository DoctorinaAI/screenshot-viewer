import { createEffect, createMemo, createSignal, Match, onCleanup, Show, Switch } from "solid-js";
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
 *
 * Three render modes:
 *  - `single`        — no pins, or only one pin: one image (the current shot).
 *  - `diff-paired`   — both pinned AND current = one of the pins: 2-pane diff,
 *                      the matching pane is marked "current".
 *  - `diff-unpaired` — both pinned AND current is neither: 3 panes, with the
 *                      current shot highlighted in the middle and arrowed pin
 *                      buttons making the slot-replacement obvious.
 */
function ShotLightbox(props: Props) {
  const t = useT();
  const open = () => props.shotIndex !== null;
  const [leftIndex, setLeftIndex] = createSignal<number | null>(null);
  const [rightIndex, setRightIndex] = createSignal<number | null>(null);
  const bothPinned = () => leftIndex() !== null && rightIndex() !== null;

  const shotAt = (i: number | null) => (i === null ? null : (props.shots[i] ?? null));
  const urlFor = (shot: Shot | null) => {
    if (!shot) return null;
    return props.archive?.urls.get(shot.imageHash) ?? null;
  };

  const current = () => shotAt(props.shotIndex);
  const url = () => urlFor(current());

  const leftPinned = () => leftIndex() !== null && leftIndex() === props.shotIndex;
  const rightPinned = () => rightIndex() !== null && rightIndex() === props.shotIndex;

  const mode = createMemo<"single" | "diff-paired" | "diff-unpaired">(() => {
    if (!bothPinned()) return "single";
    if (leftPinned() || rightPinned()) return "diff-paired";
    return "diff-unpaired";
  });

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

  // Pin-button labels switch between "Pin as N" (empty slot) and
  // "Replace N" (slot is filled with a different shot) so the user knows
  // up-front whether pressing the key adds or overwrites.
  function pinLeftLabel(): string {
    if (leftIndex() === null) return t("lightbox.pinAs1");
    if (leftPinned()) return t("lightbox.pin1");
    return t("lightbox.replace1");
  }
  function pinRightLabel(): string {
    if (rightIndex() === null) return t("lightbox.pinAs2");
    if (rightPinned()) return t("lightbox.pin2");
    return t("lightbox.replace2");
  }

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
                {/* In diff mode the title always describes the current shot;
                    surface that explicitly so the user knows what's referenced. */}
                <Show when={bothPinned()}>
                  <Badge variant="default" class="text-[11px]" data-testid="lightbox-current-badge">
                    {t("lightbox.current")}
                  </Badge>
                </Show>
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

              <Switch>
                {/* No pins, or only one pin → single image. */}
                <Match when={mode() === "single"}>
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
                </Match>

                {/* Both pinned AND current = one of them → 2-pane diff. */}
                <Match when={mode() === "diff-paired"}>
                  <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <DiffPane
                      label="1"
                      badgeVariant="ok"
                      shot={shotAt(leftIndex())}
                      url={urlFor(shotAt(leftIndex()))}
                      index={props.index}
                      isCurrent={leftPinned()}
                      slotIndex={leftIndex()}
                    />
                    <DiffPane
                      label="2"
                      badgeVariant="warning"
                      shot={shotAt(rightIndex())}
                      url={urlFor(shotAt(rightIndex()))}
                      index={props.index}
                      isCurrent={rightPinned()}
                      slotIndex={rightIndex()}
                    />
                  </div>
                </Match>

                {/* Both pinned AND current is neither → 3-pane: pin1 | CURRENT | pin2.
                    On desktop the current pane sits in the middle (larger), on
                    mobile the three panes stack with current on top. */}
                <Match when={mode() === "diff-unpaired"}>
                  <div class="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1.4fr_1fr]">
                    {/* Current sits first in source order so mobile shows it
                        first; on md+ we re-order via grid column placement. */}
                    <DiffPane
                      label={t("lightbox.current")}
                      labelKind="current"
                      shot={current()}
                      url={url()}
                      index={props.index}
                      isCurrent={true}
                      slotIndex={props.shotIndex}
                      class="md:order-2"
                    />
                    <DiffPane
                      label="1"
                      badgeVariant="ok"
                      shot={shotAt(leftIndex())}
                      url={urlFor(shotAt(leftIndex()))}
                      index={props.index}
                      slotIndex={leftIndex()}
                      class="md:order-1"
                    />
                    <DiffPane
                      label="2"
                      badgeVariant="warning"
                      shot={shotAt(rightIndex())}
                      url={urlFor(shotAt(rightIndex()))}
                      index={props.index}
                      slotIndex={rightIndex()}
                      class="md:order-3"
                    />
                  </div>
                </Match>
              </Switch>

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
                      title={
                        leftIndex() !== null && !leftPinned()
                          ? t("lightbox.pinnedShot", { n: (leftIndex() ?? 0) + 1 })
                          : undefined
                      }
                    >
                      <Badge variant="ok" class="px-1.5 py-0 text-[10px]">
                        1
                      </Badge>
                      <span>{pinLeftLabel()}</span>
                    </Button>
                    <Button
                      type="button"
                      variant={rightPinned() ? "default" : "outline"}
                      size="sm"
                      class="h-8 select-none gap-1.5"
                      onClick={pinRight}
                      aria-pressed={rightPinned()}
                      title={
                        rightIndex() !== null && !rightPinned()
                          ? t("lightbox.pinnedShot", { n: (rightIndex() ?? 0) + 1 })
                          : undefined
                      }
                    >
                      <Badge variant="warning" class="px-1.5 py-0 text-[10px]">
                        2
                      </Badge>
                      <span>{pinRightLabel()}</span>
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

interface DiffPaneProps {
  label: string;
  // For pin slots: "ok" (slot 1) / "warning" (slot 2). For the "current" pane
  // in diff-unpaired mode we use `labelKind="current"` instead of a variant.
  badgeVariant?: "ok" | "warning";
  labelKind?: "current";
  shot: Shot | null;
  url: string | null;
  index: ManifestIndex | null;
  // True when this pane represents the user's current navigation position.
  // The pane gets a ring + "you are here" hint so it never disappears from
  // sight while the user arrow-scrolls during compare.
  isCurrent?: boolean;
  // 0-based shot index this pane reflects; rendered as "#N" so the user can
  // see at a glance which slot holds which shot.
  slotIndex?: number | null;
  class?: string;
}

function DiffPane(props: DiffPaneProps) {
  const t = useT();
  const lang = () => (props.shot ? props.index?.languages.get(props.shot.languageCode) : undefined);
  const layout = () => (props.shot ? props.index?.layouts.get(props.shot.layoutId) : undefined);

  // Ring on the current pane. Solid renders class strings, so we just compose.
  const containerClass = () => {
    const base = "grid gap-2";
    return props.class ? `${base} ${props.class}` : base;
  };
  const frameClass = () =>
    props.isCurrent
      ? "grid place-items-center rounded-md bg-muted ring-2 ring-primary ring-offset-2 ring-offset-background"
      : "grid place-items-center rounded-md bg-muted";

  return (
    <figure class={containerClass()}>
      <figcaption class="flex min-w-0 flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
        <Show
          when={props.labelKind === "current"}
          fallback={
            <Badge variant={props.badgeVariant ?? "secondary"} class="px-1.5 py-0 text-[10px]">
              {props.label}
            </Badge>
          }
        >
          <Badge variant="default" class="px-1.5 py-0 text-[10px]">
            {props.label}
          </Badge>
        </Show>
        <Show when={props.shot} fallback={<span>{t("lightbox.pinShot")}</span>}>
          <span class="truncate">{lang()?.code ?? props.shot?.languageCode}</span>
          <span>·</span>
          <span class="truncate">{layout()?.name ?? props.shot?.layoutId}</span>
          <Show when={props.slotIndex !== null && props.slotIndex !== undefined}>
            <span class="ml-auto font-mono text-[10px] text-muted-foreground/70">
              #{(props.slotIndex ?? 0) + 1}
            </span>
          </Show>
        </Show>
        <Show when={props.isCurrent && props.labelKind !== "current"}>
          <Badge variant="default" class="ml-1 px-1.5 py-0 text-[10px]">
            {t("lightbox.youAreHere")}
          </Badge>
        </Show>
      </figcaption>
      <div class={frameClass()}>
        <Show
          when={props.url}
          fallback={<p class="py-12 text-xs text-muted-foreground">{t("lightbox.noImage")}</p>}
        >
          <img
            src={props.url ?? ""}
            alt={`${props.label} · ${props.shot?.caseId ?? ""}`}
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
