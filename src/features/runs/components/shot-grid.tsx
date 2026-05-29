import { createEffect, For, onCleanup, Show } from "solid-js";
import type { Shot, ShotGroup } from "@/features/runs/manifest-helpers";
import type { ImagesArchive } from "@/shared/api/storage";
import { type Manifest, ShotStatus } from "@/shared/lib/schema";
import { Badge } from "@/shared/ui/badge";
import { Skeleton } from "@/shared/ui/skeleton";

interface ShotGridProps {
  manifest: Manifest;
  groups: ShotGroup[];
  archive: ImagesArchive | null;
  archiveLoading: boolean;
  onIntent: () => void;
  onShotClick: (shot: Shot) => void;
}

function ShotGrid(props: ShotGridProps) {
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
        fallback={<p class="text-sm text-muted-foreground">No shots match the active filters.</p>}
      >
        <For each={props.groups}>
          {(group) => (
            <section class="grid gap-3">
              <header class="flex items-baseline justify-between gap-3">
                <div>
                  <h2 class="text-base font-semibold">{group.title}</h2>
                  <Show when={group.description}>
                    {(desc) => <p class="text-xs text-muted-foreground">{desc()}</p>}
                  </Show>
                </div>
                <Show when={group.hasDifferences}>
                  <Badge variant="warning">changed</Badge>
                </Show>
              </header>
              <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                <For each={group.shots}>
                  {(shot) => (
                    <ShotTile
                      manifest={props.manifest}
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
  manifest: Manifest;
  shot: Shot;
  archive: ImagesArchive | null;
  archiveLoading: boolean;
  onClick: () => void;
}

function ShotTile(props: ShotTileProps) {
  const language = () => props.manifest.languages.find((l) => l.code === props.shot.languageCode);
  const layout = () => props.manifest.layouts.find((l) => l.id === props.shot.layoutId);
  const url = () => props.archive?.urls.get(props.shot.imageHash) ?? null;

  return (
    <button
      type="button"
      onClick={props.onClick}
      class="group relative flex aspect-[9/16] overflow-hidden rounded-md border bg-muted/40 text-left ring-offset-background transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
          class="h-full w-full object-cover transition group-hover:scale-[1.02]"
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
