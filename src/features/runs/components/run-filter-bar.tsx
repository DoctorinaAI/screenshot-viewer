import type { JSX } from "solid-js";
import { For } from "solid-js";
import type { RunFilters } from "@/features/runs/manifest-helpers";
import type { Manifest, Platform, Theme } from "@/shared/lib/schema";
import { Button } from "@/shared/ui/button";
import { Switch } from "@/shared/ui/switch";

interface Props {
  manifest: Manifest;
  filters: RunFilters;
  setFilters: (next: RunFilters) => void;
}

function toggleIn<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

function RunFilterBar(props: Props) {
  const update = (patch: Partial<RunFilters>) => {
    props.setFilters({ ...props.filters, ...patch });
  };

  return (
    <div class="grid gap-3">
      <ChipGroup label="Language">
        <For each={props.manifest.languages}>
          {(lang) => (
            <Chip
              active={props.filters.languages.has(lang.code)}
              onClick={() => update({ languages: toggleIn(props.filters.languages, lang.code) })}
            >
              {lang.name}
              <span class="ml-1 text-muted-foreground">({lang.code})</span>
            </Chip>
          )}
        </For>
      </ChipGroup>
      <ChipGroup label="Layout">
        <For each={props.manifest.layouts}>
          {(layout) => (
            <Chip
              active={props.filters.layouts.has(layout.id)}
              onClick={() => update({ layouts: toggleIn(props.filters.layouts, layout.id) })}
            >
              {layout.name}
            </Chip>
          )}
        </For>
      </ChipGroup>
      <ChipGroup label="Platform">
        <For each={uniquePlatforms(props.manifest)}>
          {(platform) => (
            <Chip
              active={props.filters.platforms.has(platform)}
              onClick={() => update({ platforms: toggleIn(props.filters.platforms, platform) })}
            >
              {platform}
            </Chip>
          )}
        </For>
      </ChipGroup>
      <ChipGroup label="Theme">
        <For each={uniqueThemes(props.manifest)}>
          {(theme) => (
            <Chip
              active={props.filters.themes.has(theme)}
              onClick={() => update({ themes: toggleIn(props.filters.themes, theme) })}
            >
              {theme}
            </Chip>
          )}
        </For>
      </ChipGroup>
      <div class="flex items-center justify-between border-t pt-3">
        <Switch
          label="What changed"
          description="Only show (case, layout) groups with more than one unique image."
          checked={props.filters.whatChangedOnly}
          onChange={(v) => update({ whatChangedOnly: v })}
        />
      </div>
    </div>
  );
}

function ChipGroup(props: { label: string; children?: JSX.Element }) {
  return (
    <div class="grid gap-1.5">
      <div class="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {props.label}
      </div>
      <div class="flex flex-wrap gap-1.5">{props.children}</div>
    </div>
  );
}

function Chip(props: { active: boolean; onClick: () => void; children?: JSX.Element }) {
  return (
    <Button
      type="button"
      size="sm"
      variant={props.active ? "default" : "outline"}
      class="h-7 px-2.5 text-xs"
      onClick={props.onClick}
    >
      {props.children}
    </Button>
  );
}

function uniquePlatforms(manifest: Manifest): Platform[] {
  const set = new Set<Platform>();
  for (const s of manifest.shots) set.add(s.platform);
  return [...set];
}

function uniqueThemes(manifest: Manifest): Theme[] {
  const set = new Set<Theme>();
  for (const s of manifest.shots) set.add(s.theme);
  return [...set];
}

export { RunFilterBar };
