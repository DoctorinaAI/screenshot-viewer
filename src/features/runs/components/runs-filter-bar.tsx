import { createSignal, For, Show } from "solid-js";
import type { RunsFilterKey, RunsFilterState } from "@/features/runs/types";
import {
  RunStatus,
  type RunStatus as RunStatusT,
  WorkflowTrigger,
  type WorkflowTrigger as WorkflowTriggerT,
} from "@/shared/lib/schema";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "@/shared/ui/popover";
import { Select } from "@/shared/ui/select";

interface RunsFilterBarProps {
  state: RunsFilterState;
  setState: (next: RunsFilterState) => void;
}

interface FilterOption {
  key: RunsFilterKey;
  label: string;
}

const OPTIONS: ReadonlyArray<FilterOption> = [
  { key: "branch", label: "Branch" },
  { key: "trigger", label: "Trigger" },
  { key: "status", label: "Status" },
  { key: "language", label: "Language" },
  { key: "appVersion", label: "App version" },
  { key: "authorEmail", label: "Author email" },
];

function activeLabel(state: RunsFilterState): string | null {
  switch (state.kind) {
    case "none":
      return null;
    case "branch":
      return `branch = ${state.value}`;
    case "trigger":
      return `trigger = ${state.value}`;
    case "status":
      return `status = ${state.value}`;
    case "language":
      return `language = ${state.value}`;
    case "appVersion":
      return `version = ${state.value}`;
    case "authorEmail":
      return `author = ${state.value}`;
  }
}

function RunsFilterBar(props: RunsFilterBarProps) {
  const label = () => activeLabel(props.state);

  return (
    <div class="flex flex-wrap items-center gap-2">
      <Popover>
        <PopoverTrigger as={Button} variant="outline" size="sm">
          <FilterIcon />
          {label() ? "Change filter" : "Filter"}
        </PopoverTrigger>
        <PopoverContent class="w-80">
          <FilterEditor state={props.state} setState={props.setState} />
        </PopoverContent>
      </Popover>
      <Show when={label()}>
        <Badge variant="secondary" class="gap-1 pr-1">
          <span class="px-1">{label()}</span>
          <button
            type="button"
            class="rounded-full px-1 text-xs leading-none hover:bg-foreground/10"
            aria-label="Clear filter"
            onClick={() => props.setState({ kind: "none" })}
          >
            ×
          </button>
        </Badge>
      </Show>
    </div>
  );
}

function FilterEditor(props: RunsFilterBarProps) {
  const [pendingKey, setPendingKey] = createSignal<RunsFilterKey>(
    props.state.kind === "none" ? "branch" : props.state.kind,
  );
  const [pendingValue, setPendingValue] = createSignal(
    props.state.kind === "none" ? "" : (props.state.value as string),
  );

  const apply = () => {
    const key = pendingKey();
    const value = pendingValue().trim();
    if (!value) {
      props.setState({ kind: "none" });
      return;
    }
    switch (key) {
      case "branch":
        props.setState({ kind: "branch", value });
        break;
      case "trigger":
        props.setState({ kind: "trigger", value: value as WorkflowTriggerT });
        break;
      case "status":
        props.setState({ kind: "status", value: value as RunStatusT });
        break;
      case "language":
        props.setState({ kind: "language", value });
        break;
      case "appVersion":
        props.setState({ kind: "appVersion", value });
        break;
      case "authorEmail":
        props.setState({ kind: "authorEmail", value });
        break;
    }
  };

  return (
    <div class="grid gap-3">
      <PopoverTitle>Filter runs</PopoverTitle>
      <PopoverDescription>
        One filter at a time — combos need their own composite index.
      </PopoverDescription>
      <div class="grid grid-cols-2 gap-1.5">
        <For each={OPTIONS}>
          {(opt) => (
            <Button
              type="button"
              size="sm"
              variant={pendingKey() === opt.key ? "default" : "outline"}
              onClick={() => setPendingKey(opt.key)}
            >
              {opt.label}
            </Button>
          )}
        </For>
      </div>
      <Show
        when={pendingKey() === "trigger"}
        fallback={
          <Show
            when={pendingKey() === "status"}
            fallback={
              <Input
                placeholder={placeholderFor(pendingKey())}
                value={pendingValue()}
                onInput={(e) => setPendingValue(e.currentTarget.value)}
                autofocus
              />
            }
          >
            <Select<RunStatusT>
              options={[RunStatus.Success, RunStatus.Partial, RunStatus.Failed]}
              value={(pendingValue() as RunStatusT) || undefined}
              onChange={(v) => setPendingValue(v ?? "")}
              placeholder="Pick status"
            />
          </Show>
        }
      >
        <Select<WorkflowTriggerT>
          options={[
            WorkflowTrigger.Push,
            WorkflowTrigger.PullRequest,
            WorkflowTrigger.WorkflowDispatch,
            WorkflowTrigger.Schedule,
          ]}
          value={(pendingValue() as WorkflowTriggerT) || undefined}
          onChange={(v) => setPendingValue(v ?? "")}
          placeholder="Pick trigger"
        />
      </Show>
      <div class="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setPendingValue("");
            props.setState({ kind: "none" });
          }}
        >
          Clear
        </Button>
        <Button type="button" size="sm" onClick={apply}>
          Apply
        </Button>
      </div>
    </div>
  );
}

function placeholderFor(key: RunsFilterKey): string {
  switch (key) {
    case "branch":
      return "develop";
    case "language":
      return "en";
    case "appVersion":
      return "1.42.0+1234";
    case "authorEmail":
      return "user@doctorina.com";
    default:
      return "";
  }
}

function FilterIcon() {
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
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

export { RunsFilterBar };
