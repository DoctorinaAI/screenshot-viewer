import { A } from "@solidjs/router";
import { For, Show } from "solid-js";
import { formatFullDateTime, formatRelativeTime } from "@/shared/lib/relative-time";
import { type RunDoc, RunStatus } from "@/shared/lib/schema";
import { Avatar } from "@/shared/ui/avatar";
import { Badge, type BadgeProps } from "@/shared/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";

function statusBadge(status: RunDoc["workflow"]["status"]): BadgeProps["variant"] {
  switch (status) {
    case RunStatus.Success:
      return "ok";
    case RunStatus.Partial:
      return "warning";
    case RunStatus.Failed:
      return "failed";
  }
}

function authorInitials(run: RunDoc): string {
  const name = run.git.author.name || run.git.author.email;
  const parts = name.split(/[\s.@]+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

const LANGUAGES_PREVIEW = 3;

interface RunCardProps {
  run: RunDoc;
}

function RunCard(props: RunCardProps) {
  const createdAtDate = () => props.run.createdAt.toDate();

  return (
    <A href={`/runs/${props.run.runId}`} class="block focus:outline-none">
      <Card interactive class="h-full">
        <CardHeader class="gap-3">
          <div class="flex flex-wrap items-center gap-2">
            <Badge variant={statusBadge(props.run.workflow.status)}>
              {props.run.workflow.status}
            </Badge>
            <Badge variant="outline" class="font-mono text-[11px] uppercase tracking-wide">
              {props.run.git.branch}
            </Badge>
            <Show when={props.run.pr}>
              {(pr) => (
                <Badge variant="secondary" class="font-mono text-[11px]">
                  PR #{pr().number}
                </Badge>
              )}
            </Show>
          </div>
          <CardTitle class="line-clamp-2 text-base font-medium leading-snug">
            {props.run.git.commitSubject}
          </CardTitle>
          <CardDescription class="font-mono text-[11px]">
            {props.run.git.commitShaShort} · v{props.run.app.version}
          </CardDescription>
        </CardHeader>
        <CardContent class="grid gap-3">
          <div class="flex flex-wrap items-center gap-2 text-xs">
            <For each={props.run.languages.slice(0, LANGUAGES_PREVIEW)}>
              {(lang) => (
                <span class="rounded bg-muted px-1.5 py-0.5 font-mono uppercase text-muted-foreground">
                  {lang}
                </span>
              )}
            </For>
            <Show when={props.run.languages.length > LANGUAGES_PREVIEW}>
              <span class="text-muted-foreground">
                +{props.run.languages.length - LANGUAGES_PREVIEW}
              </span>
            </Show>
          </div>
          <dl class="grid grid-cols-3 gap-3 text-sm">
            <Stat label="Shots" value={props.run.stats.totalShots} />
            <Stat label="Unique" value={props.run.stats.uniqueImages} />
            <Stat
              label="Failed"
              value={props.run.stats.failedCount}
              highlight={props.run.stats.failedCount > 0}
            />
          </dl>
        </CardContent>
        <CardFooter class="justify-between gap-3 text-xs text-muted-foreground">
          <div class="flex items-center gap-2 truncate">
            <Avatar
              size="sm"
              src={props.run.git.author.avatarUrl ?? null}
              fallback={authorInitials(props.run)}
            />
            <span class="truncate">{props.run.git.author.name}</span>
          </div>
          <Tooltip>
            <TooltipTrigger as="span" class="cursor-help">
              {formatRelativeTime(createdAtDate())}
            </TooltipTrigger>
            <TooltipContent>{formatFullDateTime(createdAtDate())}</TooltipContent>
          </Tooltip>
        </CardFooter>
      </Card>
    </A>
  );
}

function Stat(props: { label: string; value: number; highlight?: boolean }) {
  return (
    <div class="grid gap-0.5">
      <dt class="text-[10px] uppercase tracking-wide text-muted-foreground">{props.label}</dt>
      <dd
        class={`text-base font-semibold tabular-nums ${
          props.highlight ? "text-status-failed" : "text-foreground"
        }`}
      >
        {props.value.toLocaleString("en-US")}
      </dd>
    </div>
  );
}

export { RunCard };
