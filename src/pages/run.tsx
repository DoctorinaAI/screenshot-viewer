import { A, useParams } from "@solidjs/router";
import { createMemo, createSignal, Show } from "solid-js";
import { useRegisterBack, useRegisterFilters } from "@/app/app-bar-context";
import { RunFilterBar } from "@/features/runs/components/run-filter-bar";
import { RunGroupingSwitcher } from "@/features/runs/components/run-grouping-switcher";
import { RunHeader } from "@/features/runs/components/run-header";
import { ShotGrid } from "@/features/runs/components/shot-grid";
import { ShotLightbox } from "@/features/runs/components/shot-lightbox";
import { createRunStore } from "@/features/runs/run-store";
import { useT } from "@/shared/lib/i18n";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";

function RunPage() {
  const t = useT();
  const params = useParams<{ runId: string }>();
  // Pass an accessor so the store refetches when @solidjs/router updates the
  // param without remounting the page (same route pattern, different runId).
  const store = createRunStore(() => params.runId);

  const [lightboxIndex, setLightboxIndex] = createSignal<number | null>(null);

  useRegisterBack(() => ({ href: "/", labelKey: "nav.backToRuns" }));

  useRegisterFilters({
    labelKey: "common.filters",
    activeLabel: () => {
      const f = store.filters();
      const count =
        f.languages.size +
        f.layouts.size +
        f.platforms.size +
        f.themes.size +
        (f.whatChangedOnly ? 1 : 0);
      return count > 0 ? String(count) : null;
    },
    content: () => (
      <Show when={store.state().manifest}>
        {(manifest) => (
          <div class="grid gap-4">
            <RunGroupingSwitcher value={store.groupBy()} onChange={store.setGroupBy} />
            <RunFilterBar
              manifest={manifest()}
              filters={store.filters()}
              setFilters={store.setFilters}
            />
          </div>
        )}
      </Show>
    ),
  });

  // For the lightbox: flat list of shots across groups, in the same order
  // the user sees them rendered.
  const flatShots = createMemo(() => store.groups().flatMap((g) => g.shots));

  return (
    <div class="grid gap-5">
      <Show when={!store.state().loading} fallback={<HeaderSkeleton />}>
        <Show
          when={store.state().run}
          fallback={
            <Card>
              <CardContent class="grid gap-3 py-8 text-sm">
                <p class="text-destructive">{store.state().error ?? t("run.notFound")}</p>
                <div>
                  <A href="/">
                    <Button type="button" variant="outline" size="sm" class="select-none">
                      {t("nav.backToRuns")}
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
        <ShotGrid
          index={store.manifestIndex()}
          groups={store.groups()}
          archive={store.state().archive}
          archiveLoading={store.state().archiveLoading}
          onIntent={store.ensureArchive}
          onShotClick={(shot) => {
            const i = flatShots().findIndex((s) => s.id === shot.id);
            if (i >= 0) setLightboxIndex(i);
          }}
        />
        <ShotLightbox
          index={store.manifestIndex()}
          archive={store.state().archive}
          shots={flatShots()}
          shotIndex={lightboxIndex()}
          onChangeIndex={setLightboxIndex}
        />
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
