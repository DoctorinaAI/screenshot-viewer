import { createEffect, For, onCleanup, Show } from "solid-js";
import type { Shot, ShotGroup } from "@/features/runs/manifest-helpers";
import type { ManifestIndex } from "@/features/runs/run-store";
import type { ImagesArchive } from "@/shared/api/storage";
import { useT } from "@/shared/lib/i18n";
import { ShotStatus } from "@/shared/lib/schema";
import { Badge } from "@/shared/ui/badge";
import { Skeleton } from "@/shared/ui/skeleton";

interface ShotGridProps {
  index: ManifestIndex | null;
  groups: ShotGroup[];
  archive: ImagesArchive | null;
  archiveLoading: boolean;
  onIntent: () => void;
  onShotClick: (shot: Shot) => void;
}

/**
 * Responsive tile grid. Tiles are fixed 9:16 aspect, and the parent grid
 * uses `content-visibility: auto` with `contain-intrinsic-size` so off-screen
 * sections don't pay layout cost. Thumbs come from archive.thumbs() with
 * graceful fallback to the full image while they generate.
 */
function ShotGrid(props: ShotGridProps) {
  const t = useT();
  let sentinel: HTMLDivElement | undefined;

  createEffect(() => {
    if (!sentinel) return;
    if (typeof IntersectionObserver === "undefined") {
      props.onIntent();
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            props.onIntent();
            observer.disconnect();
            return;
          }
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(sentinel);
    onCleanup(() => observer.disconnect());
  });

  return (
    <div class="grid gap-8">
      <div ref={sentinel} aria-hidden="true" />
      <Show
        when={props.groups.length > 0}
        fallback={<p class="select-none text-sm text-muted-foreground">{t("run.shots.empty")}</p>}
      >
        <For each={props.groups}>
          {(group) => (
            <section class="grid gap-3 [content-visibility:auto] [contain-intrinsic-size:auto_24rem]">
              <header class="flex items-baseline justify-between gap-3">
                <div class="min-w-0">
                  <h2 class="select-none truncate text-base font-semibold">{group.title}</h2>
                  <Show when={group.description}>
                    {(desc) => (
                      <p class="select-none truncate text-xs text-muted-foreground">{desc()}</p>
                    )}
                  </Show>
                </div>
                <Show when={group.hasDifferences}>
                  <Badge variant="warning" class="shrink-0">
                    {t("run.changedBadge")}
                  </Badge>
                </Show>
              </header>
              <div class="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                <For each={group.shots}>
                  {(shot) => (
                    <ShotTile
                      index={props.index}
                      shot={shot}
                      archive={props.archive}
                      archiveLoading={props.archiveLoading}
                      onClick={() => props.onShotClick(shot)}
                    />
                  )}
                </For>
              </div>
            </section>
          )}
        </For>
      </Show>
    </div>
  );
}

interface ShotTileProps {
  index: ManifestIndex | null;
  shot: Shot;
  archive: ImagesArchive | null;
  archiveLoading: boolean;
  onClick: () => void;
}

function ShotTile(props: ShotTileProps) {
  const language = () => props.index?.languages.get(props.shot.languageCode);
  const layout = () => props.index?.layouts.get(props.shot.layoutId);
  // Prefer the thumb; fall back to the full image until a thumb is generated
  // (or if the source was already small enough that we skipped generation).
  const url = () => {
    const archive = props.archive;
    if (!archive) return null;
    return (
      archive.thumbs().get(props.shot.imageHash) ?? archive.urls.get(props.shot.imageHash) ?? null
    );
  };

  return (
    <button
      type="button"
      onClick={props.onClick}
      class="group relative flex aspect-[9/16] select-none overflow-hidden rounded-md border bg-muted/40 text-left ring-offset-background transition will-change-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      aria-label={`${props.shot.caseId} · ${props.shot.languageCode} · ${props.shot.layoutId}`}
    >
      <Show
        when={url()}
        fallback={
          <Show when={!props.archiveLoading} fallback={<Skeleton class="absolute inset-0" />}>
            <div class="absolute inset-0 grid place-items-center px-2 text-center text-[10px] text-muted-foreground">
              <span>
                {language()?.code ?? props.shot.languageCode}
                <br />
                {layout()?.name ?? props.shot.layoutId}
              </span>
            </div>
          </Show>
        }
      >
        <img
          src={url() ?? ""}
          alt={`${props.shot.caseId} · ${props.shot.languageCode} · ${props.shot.layoutId}`}
          loading="lazy"
          decoding="async"
          draggable={false}
          width={180}
          height={320}
          class="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
        />
      </Show>
      <StatusBadge status={props.shot.status} />
      <div class="absolute bottom-1 left-1 right-1 flex items-center gap-1 text-[10px]">
        <Badge variant="secondary" class="px-1.5 py-0 text-[10px] uppercase">
          {props.shot.languageCode}
        </Badge>
        <Badge variant="outline" class="px-1.5 py-0 text-[10px]">
          {props.shot.platform}
        </Badge>
      </div>
    </button>
  );
}

function StatusBadge(props: { status: Shot["status"] }) {
  if (props.status === ShotStatus.Ok) return null;
  return (
    <Badge
      variant={props.status === ShotStatus.Failed ? "failed" : "warning"}
      class="absolute right-1 top-1 px-1.5 py-0 text-[10px]"
    >
      {props.status}
    </Badge>
  );
}

export { ShotGrid };
