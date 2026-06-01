import { createEffect, For, onCleanup, Show } from "solid-js";
import { useRegisterFilters } from "@/app/app-bar-context";
import { RunCard } from "@/features/runs/components/run-card";
import { RunCardSkeleton } from "@/features/runs/components/run-card-skeleton";
import { RunsFilterEditor, useActiveLabel } from "@/features/runs/components/runs-filter-bar";
import { createRunsStore } from "@/features/runs/store";
import { useT } from "@/shared/lib/i18n";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";

const PAGE_GRID =
  "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 [grid-auto-rows:1fr]";

function RunsList() {
  const store = createRunsStore();
  const t = useT();
  const labelFor = useActiveLabel();

  useRegisterFilters({
    labelKey: "common.filters",
    activeLabel: () => labelFor(store.filter()),
    content: () => <RunsFilterEditor state={store.filter()} setState={store.setFilter} />,
  });

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
      <Show when={store.state().error}>
        {(message) => (
          <Card>
            <CardContent class="grid gap-3 py-6">
              <p class="text-sm text-destructive">{t("home.loadFail", { message: message() })}</p>
              <div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  class="select-none"
                  onClick={store.refresh}
                >
                  {t("common.retry")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </Show>

      <Show when={showEmpty()}>
        <Card>
          <CardContent class="grid gap-2 py-12 text-center">
            <p class="select-none text-base font-medium">{t("home.empty.title")}</p>
            <p class="select-none text-sm text-muted-foreground">{t("home.empty.subtitle")}</p>
            <div class="mt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                class="select-none"
                onClick={store.refresh}
              >
                {t("common.refresh")}
              </Button>
            </div>
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
              class="select-none"
              disabled={store.state().loading}
              onClick={store.loadMore}
            >
              {t("home.loadMore")}
            </Button>
          </div>
        </div>
      </Show>
    </section>
  );
}

export { RunsList };
