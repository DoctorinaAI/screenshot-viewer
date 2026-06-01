import {
  createEffect,
  createMemo,
  createSignal,
  For,
  Match,
  onCleanup,
  Show,
  Switch,
} from "solid-js";
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

type Mode = "single" | "diff-paired" | "diff-unpaired";
type MobileTab = "1" | "2" | "current";

/**
 * Lightbox with compare. Three render modes by (pins, currentIndex):
 *  - `single`        — no pins or one pin: one image (the current shot).
 *  - `diff-paired`   — both pinned AND current = one of them: 2-pane diff,
 *                      the matching pane gets a "you are here" ring.
 *  - `diff-unpaired` — both pinned AND current is neither: 3-pane diff with
 *                      the current shot highlighted in the middle.
 *
 * Layout adapts to viewport:
 *  - md+ (≥768px): full multi-pane comparison as described above.
 *  - <md: a tab strip lets the user swap between {1, current?, 2}; only one
 *         image is shown at a time so each fills the screen. Two portrait
 *         screenshots side-by-side at 390 px is unreadable, so we don't
 *         pretend otherwise.
 *
 * Diff keys: `1` pins left, `2` pins right, `3` (and Backspace) clears.
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

  const mode = createMemo<Mode>(() => {
    if (!bothPinned()) return "single";
    if (leftPinned() || rightPinned()) return "diff-paired";
    return "diff-unpaired";
  });

  // Mobile compare: track which pane the user is peeking at. Auto-snaps back
  // to whichever pane corresponds to their current navigation index so arrow
  // navigation always lands on a visible image.
  const [mobileTab, setMobileTab] = createSignal<MobileTab>("current");
  createEffect(() => {
    void props.shotIndex;
    void leftIndex();
    void rightIndex();
    if (leftPinned()) setMobileTab("1");
    else if (rightPinned()) setMobileTab("2");
    else setMobileTab("current");
  });

  const mobileTabShot = () => {
    switch (mobileTab()) {
      case "1":
        return shotAt(leftIndex());
      case "2":
        return shotAt(rightIndex());
      default:
        return current();
    }
  };
  const mobileTabUrl = () => urlFor(mobileTabShot());
  const mobileTabSlotIndex = () => {
    switch (mobileTab()) {
      case "1":
        return leftIndex();
      case "2":
        return rightIndex();
      default:
        return props.shotIndex;
    }
  };

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

  // Which mobile tabs to render. In diff-paired the current = one of the pins,
  // so showing a separate "current" tab would duplicate it.
  const mobileTabs = createMemo<MobileTab[]>(() => {
    if (mode() === "diff-paired") return ["1", "2"];
    if (mode() === "diff-unpaired") return ["1", "current", "2"];
    return [];
  });

  return (
    <Dialog
      open={open()}
      onOpenChange={(next) => {
        if (!next) props.onChangeIndex(null);
      }}
    >
      <DialogContent class="sm:w-[min(72rem,calc(100vw-1.5rem))] sm:max-w-none">
        <Show when={meta(current())}>
          {(m) => (
            <div class="flex h-full flex-col gap-3">
              <DialogTitle class="flex min-w-0 flex-wrap items-center gap-2 pr-8 text-base">
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

              {/* Mobile tab strip — only rendered in diff modes. Hidden on md+. */}
              <Show when={mobileTabs().length > 0}>
                <div class="flex gap-1 md:hidden" role="tablist" aria-label={t("lightbox.current")}>
                  <For each={mobileTabs()}>
                    {(tab) => (
                      <MobileTabButton
                        tab={tab}
                        active={mobileTab() === tab}
                        leftIndex={leftIndex()}
                        rightIndex={rightIndex()}
                        currentIndex={props.shotIndex}
                        onSelect={() => setMobileTab(tab)}
                      />
                    )}
                  </For>
                </div>
              </Show>

              {/* IMAGE AREA */}
              <div class="min-h-0 flex-1">
                <Switch>
                  {/* Single image — same everywhere. */}
                  <Match when={mode() === "single"}>
                    <div class="grid h-full place-items-center rounded-md bg-muted">
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
                          class="max-h-[70vh] w-auto select-none object-contain sm:max-h-[65vh]"
                        />
                      </Show>
                    </div>
                  </Match>

                  {/* Both pinned AND current = one of them. */}
                  <Match when={mode() === "diff-paired"}>
                    {/* Mobile: single image driven by the active tab. */}
                    <div class="md:hidden">
                      <DiffPane
                        label={mobileTab() === "1" ? "1" : "2"}
                        badgeVariant={mobileTab() === "1" ? "ok" : "warning"}
                        shot={mobileTabShot()}
                        url={mobileTabUrl()}
                        index={props.index}
                        isCurrent={
                          (mobileTab() === "1" && leftPinned()) ||
                          (mobileTab() === "2" && rightPinned())
                        }
                        slotIndex={mobileTabSlotIndex()}
                        size="mobile"
                      />
                    </div>
                    {/* Desktop: full 2-pane side-by-side. */}
                    <div class="hidden gap-3 md:grid md:grid-cols-2">
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

                  {/* Both pinned AND current is neither. */}
                  <Match when={mode() === "diff-unpaired"}>
                    {/* Mobile: single image driven by the active tab. */}
                    <div class="md:hidden">
                      <Switch>
                        <Match when={mobileTab() === "1"}>
                          <DiffPane
                            label="1"
                            badgeVariant="ok"
                            shot={shotAt(leftIndex())}
                            url={urlFor(shotAt(leftIndex()))}
                            index={props.index}
                            slotIndex={leftIndex()}
                            size="mobile"
                          />
                        </Match>
                        <Match when={mobileTab() === "2"}>
                          <DiffPane
                            label="2"
                            badgeVariant="warning"
                            shot={shotAt(rightIndex())}
                            url={urlFor(shotAt(rightIndex()))}
                            index={props.index}
                            slotIndex={rightIndex()}
                            size="mobile"
                          />
                        </Match>
                        <Match when={mobileTab() === "current"}>
                          <DiffPane
                            label={t("lightbox.current")}
                            labelKind="current"
                            shot={current()}
                            url={url()}
                            index={props.index}
                            isCurrent={true}
                            slotIndex={props.shotIndex}
                            size="mobile"
                          />
                        </Match>
                      </Switch>
                    </div>
                    {/* Desktop: full 3-pane with current in the middle. */}
                    <div class="hidden gap-3 md:grid md:grid-cols-[1fr_1.4fr_1fr]">
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
              </div>

              {/* CONTROLS — sticky at the bottom of the dialog so they're
                  always reachable, even after the image scrolls. */}
              <div class="sticky bottom-0 -mx-3 grid gap-2 border-t bg-background/95 px-3 pb-1 pt-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-0">
                <div class="flex flex-wrap items-center gap-2 sm:justify-between">
                  <div class="flex w-full flex-wrap items-center gap-1.5 sm:w-auto">
                    <Button
                      type="button"
                      variant={leftPinned() ? "default" : "outline"}
                      size="sm"
                      class="h-10 flex-1 select-none gap-1.5 sm:h-8 sm:flex-initial"
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
                      class="h-10 flex-1 select-none gap-1.5 sm:h-8 sm:flex-initial"
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
                      class="h-10 select-none gap-1.5 sm:h-8"
                      onClick={clearDiff}
                      disabled={leftIndex() === null && rightIndex() === null}
                    >
                      <Badge variant="outline" class="px-1.5 py-0 text-[10px]">
                        3
                      </Badge>
                      <span>{t("lightbox.clearDiff")}</span>
                    </Button>
                  </div>
                  <div class="flex w-full shrink-0 gap-1.5 sm:w-auto">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      class="h-10 flex-1 select-none sm:h-8 sm:flex-initial"
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
                      class="h-10 flex-1 select-none sm:h-8 sm:flex-initial"
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

interface MobileTabButtonProps {
  tab: MobileTab;
  active: boolean;
  leftIndex: number | null;
  rightIndex: number | null;
  currentIndex: number | null;
  onSelect: () => void;
}

function MobileTabButton(props: MobileTabButtonProps) {
  const t = useT();
  const slotIndex = () => {
    switch (props.tab) {
      case "1":
        return props.leftIndex;
      case "2":
        return props.rightIndex;
      default:
        return props.currentIndex;
    }
  };
  const variant = () => {
    if (props.active) return "default";
    return "outline";
  };
  const badgeVariant = () => {
    switch (props.tab) {
      case "1":
        return "ok";
      case "2":
        return "warning";
      default:
        return "default";
    }
  };
  const label = () => (props.tab === "current" ? t("lightbox.current") : props.tab);

  return (
    <Button
      type="button"
      variant={variant()}
      size="sm"
      class="h-10 flex-1 select-none gap-1.5"
      onClick={props.onSelect}
      role="tab"
      aria-selected={props.active}
    >
      <Badge variant={badgeVariant()} class="px-1.5 py-0 text-[10px]">
        {label()}
      </Badge>
      <Show when={slotIndex() !== null && slotIndex() !== undefined}>
        <span class="font-mono text-[11px] opacity-80">#{(slotIndex() ?? 0) + 1}</span>
      </Show>
    </Button>
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
  badgeVariant?: "ok" | "warning";
  labelKind?: "current";
  shot: Shot | null;
  url: string | null;
  index: ManifestIndex | null;
  isCurrent?: boolean;
  slotIndex?: number | null;
  class?: string;
  // "mobile" expands the image to the full available space (single image
  // visible at a time). "default" keeps the original capped sizing for
  // side-by-side desktop layouts.
  size?: "default" | "mobile";
}

function DiffPane(props: DiffPaneProps) {
  const t = useT();
  const lang = () => (props.shot ? props.index?.languages.get(props.shot.languageCode) : undefined);
  const layout = () => (props.shot ? props.index?.layouts.get(props.shot.layoutId) : undefined);

  const containerClass = () => {
    const base = "grid gap-2";
    return props.class ? `${base} ${props.class}` : base;
  };
  const frameClass = () =>
    props.isCurrent
      ? "grid place-items-center rounded-md bg-muted ring-2 ring-primary ring-offset-2 ring-offset-background"
      : "grid place-items-center rounded-md bg-muted";
  const imgClass = () =>
    props.size === "mobile"
      ? "max-h-[60vh] w-auto select-none object-contain"
      : "max-h-[60vh] w-auto select-none object-contain";

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
            class={imgClass()}
          />
        </Show>
      </div>
    </figure>
  );
}

export { ShotLightbox };
