import { createEffect, For, onCleanup, Show } from "solid-js";
import { RunCard } from "@/features/runs/components/run-card";
import { RunCardSkeleton } from "@/features/runs/components/run-card-skeleton";
import { RunsFilterBar } from "@/features/runs/components/runs-filter-bar";
import { createRunsStore } from "@/features/runs/store";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";

const PAGE_GRID = "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

function RunsList() {
  const store = createRunsStore();

  let sentinel: HTMLDivElement | undefined;

  // Track hasMore so this effect re-runs when the <Show> below mounts the
  // sentinel after the first page arrives. Without this dep the effect would
  // only run once on mount (sentinel === undefined) and infinite scroll would
  // silently never engage.
  createEffect(() => {
    if (!store.state().hasMore) return;
    if (!sentinel) return;
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) store.loadMore();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(sentinel);
    onCleanup(() => observer.disconnect());
  });

  const showInitialSkeletons = () => store.state().loading && store.state().runs.length === 0;
  const showEmpty = () =>
    !store.state().loading && !store.state().error && store.state().runs.length === 0;

  return (
    <section class="grid gap-4">
      <RunsFilterBar state={store.filter()} setState={store.setFilter} />

      <Show when={store.state().error}>
        {(message) => (
          <Card>
            <CardContent class="grid gap-3 py-6">
              <p class="text-sm text-destructive">Failed to load runs: {message()}</p>
              <div>
                <Button type="button" variant="outline" size="sm" onClick={store.refresh}>
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </Show>

      <Show when={showEmpty()}>
        <Card>
          <CardContent class="grid gap-2 py-12 text-center">
            <p class="text-base font-medium">No runs match this filter.</p>
            <p class="text-sm text-muted-foreground">
              CI uploads land here automatically. Adjust the filter or wait for the next run.
            </p>
          </CardContent>
        </Card>
      </Show>

      <Show
        when={!showInitialSkeletons()}
        fallback={
          <div class={PAGE_GRID}>
            <For each={Array.from({ length: 6 })}>{() => <RunCardSkeleton />}</For>
          </div>
        }
      >
        <Show when={store.state().runs.length > 0}>
          <div class={PAGE_GRID}>
            <For each={store.state().runs}>{(run) => <RunCard run={run} />}</For>
          </div>
        </Show>
      </Show>

      <Show when={store.state().hasMore}>
        <div ref={sentinel} class="grid gap-3 pt-2">
          <Show when={store.state().loading}>
            <div class={PAGE_GRID}>
              <For each={Array.from({ length: 4 })}>{() => <RunCardSkeleton />}</For>
            </div>
          </Show>
          <div class="grid place-items-center pb-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={store.state().loading}
              onClick={store.loadMore}
            >
              Load more
            </Button>
          </div>
        </div>
      </Show>
    </section>
  );
}

export { RunsList };
