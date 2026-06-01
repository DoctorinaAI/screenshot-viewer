import { createSignal, For, Show } from "solid-js";
import type { RunsFilterKey, RunsFilterState } from "@/features/runs/types";
import { useT } from "@/shared/lib/i18n";
import {
  RunStatus,
  type RunStatus as RunStatusT,
  WorkflowTrigger,
  type WorkflowTrigger as WorkflowTriggerT,
} from "@/shared/lib/schema";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Select } from "@/shared/ui/select";

interface RunsFilterEditorProps {
  state: RunsFilterState;
  setState: (next: RunsFilterState) => void;
  onApplied?: () => void;
}

interface FilterOption {
  key: RunsFilterKey;
  labelKey: string;
}

const OPTIONS: ReadonlyArray<FilterOption> = [
  { key: "branch", labelKey: "filters.key.branch" },
  { key: "trigger", labelKey: "filters.key.trigger" },
  { key: "status", labelKey: "filters.key.status" },
  { key: "language", labelKey: "filters.key.language" },
  { key: "appVersion", labelKey: "filters.key.appVersion" },
  { key: "authorEmail", labelKey: "filters.key.authorEmail" },
];

/**
 * Localized label for the currently active filter, used in the app-bar
 * popover trigger badge. Returns null when no filter is active.
 */
function useActiveLabel(): (state: RunsFilterState) => string | null {
  const t = useT();
  return (state) => {
    switch (state.kind) {
      case "none":
        return null;
      case "branch":
        return `${t("filters.key.branch")}: ${state.value}`;
      case "trigger":
        return `${t("filters.key.trigger")}: ${state.value}`;
      case "status":
        return `${t("filters.key.status")}: ${state.value}`;
      case "language":
        return `${t("filters.key.language")}: ${state.value}`;
      case "appVersion":
        return `${t("filters.key.appVersion")}: ${state.value}`;
      case "authorEmail":
        return `${t("filters.key.authorEmail")}: ${state.value}`;
    }
  };
}

function RunsFilterEditor(props: RunsFilterEditorProps) {
  const t = useT();
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
      props.onApplied?.();
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
    props.onApplied?.();
  };

  const placeholder = (key: RunsFilterKey): string => {
    switch (key) {
      case "branch":
        return t("filters.placeholder.branch");
      case "language":
        return t("filters.placeholder.language");
      case "appVersion":
        return t("filters.placeholder.appVersion");
      case "authorEmail":
        return t("filters.placeholder.authorEmail");
      default:
        return "";
    }
  };

  return (
    <div class="grid gap-3">
      <div class="grid grid-cols-2 gap-1.5">
        <For each={OPTIONS}>
          {(opt) => (
            <Button
              type="button"
              size="sm"
              class="select-none"
              variant={pendingKey() === opt.key ? "default" : "outline"}
              onClick={() => setPendingKey(opt.key)}
            >
              {t(opt.labelKey)}
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
                placeholder={placeholder(pendingKey())}
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
              placeholder={t("filters.pickStatus")}
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
          placeholder={t("filters.pickTrigger")}
        />
      </Show>
      <div class="flex justify-end gap-2 pt-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          class="select-none"
          onClick={() => {
            setPendingValue("");
            props.setState({ kind: "none" });
            props.onApplied?.();
          }}
        >
          {t("common.clear")}
        </Button>
        <Button type="button" size="sm" class="select-none" onClick={apply}>
          {t("common.apply")}
        </Button>
      </div>
    </div>
  );
}

export { RunsFilterEditor, useActiveLabel };
