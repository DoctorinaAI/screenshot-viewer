import { A, useParams } from "@solidjs/router";
import { createMemo, createSignal, Show } from "solid-js";
import { RunFilterBar } from "@/features/runs/components/run-filter-bar";
import { RunGroupingSwitcher } from "@/features/runs/components/run-grouping-switcher";
import { RunHeader } from "@/features/runs/components/run-header";
import { ShotGrid } from "@/features/runs/components/shot-grid";
import { ShotLightbox } from "@/features/runs/components/shot-lightbox";
import { createRunStore } from "@/features/runs/run-store";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";

function RunPage() {
  const params = useParams<{ runId: string }>();
  const store = createRunStore(params.runId);

  const [lightboxIndex, setLightboxIndex] = createSignal<number | null>(null);

  // For the lightbox: flat list of shots across groups, in the same order
  // the user sees them rendered.
  const flatShots = createMemo(() => store.groups().flatMap((g) => g.shots));

  return (
    <div class="grid gap-6">
      <div class="flex items-center justify-between gap-3 text-sm">
        <A href="/" class="text-muted-foreground hover:text-foreground">
          ← All runs
        </A>
        <span class="font-mono text-xs text-muted-foreground">run {params.runId}</span>
      </div>

      <Show when={!store.state().loading} fallback={<HeaderSkeleton />}>
        <Show
          when={store.state().run}
          fallback={
            <Card>
              <CardContent class="grid gap-3 py-8 text-sm">
                <p class="text-destructive">{store.state().error ?? "Run not found."}</p>
                <div>
                  <A href="/">
                    <Button type="button" variant="outline" size="sm">
                      Back to runs
                    </Button>
                  </A>
                </div>
              </CardContent>
            </Card>
          }
        >
          {(run) => <RunHeader run={run()} />}
        </Show>
      </Show>

      <Show when={store.state().manifest}>
        {(manifest) => (
          <div class="grid gap-4 lg:grid-cols-[20rem,1fr]">
            <aside class="lg:sticky lg:top-20 lg:self-start">
              <Card>
                <CardContent class="grid gap-3 py-5">
                  <RunGroupingSwitcher value={store.groupBy()} onChange={store.setGroupBy} />
                  <RunFilterBar
                    manifest={manifest()}
                    filters={store.filters()}
                    setFilters={store.setFilters}
                  />
                </CardContent>
              </Card>
            </aside>
            <div>
              <ShotGrid
                manifest={manifest()}
                groups={store.groups()}
                archive={store.state().archive}
                archiveLoading={store.state().archiveLoading}
                onIntent={store.ensureArchive}
                onShotClick={(shot) => {
                  const i = flatShots().findIndex((s) => s.id === shot.id);
                  if (i >= 0) setLightboxIndex(i);
                }}
              />
            </div>
            <ShotLightbox
              manifest={manifest()}
              archive={store.state().archive}
              shots={flatShots()}
              index={lightboxIndex()}
              onChangeIndex={setLightboxIndex}
            />
          </div>
        )}
      </Show>
    </div>
  );
}

function HeaderSkeleton() {
  return (
    <Card>
      <CardContent class="grid gap-3 py-6">
        <Skeleton class="h-5 w-32" />
        <Skeleton class="h-7 w-3/4" />
        <Skeleton class="h-4 w-1/2" />
      </CardContent>
    </Card>
  );
}

export default RunPage;
