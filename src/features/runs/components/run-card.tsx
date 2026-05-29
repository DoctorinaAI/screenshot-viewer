import { A } from "@solidjs/router";
import { For, Show } from "solid-js";
import { formatFullDateTime, formatRelativeTime } from "@/shared/lib/relative-time";
import type { RunDoc } from "@/shared/lib/schema";
import { Avatar } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import { authorInitials, runStatusBadge, Stat } from "./run-stat";

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
            <Badge variant={runStatusBadge(props.run.workflow.status)}>
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
            <Stat label="Shots" value={props.run.stats.totalShots} size="sm" />
            <Stat label="Unique" value={props.run.stats.uniqueImages} size="sm" />
            <Stat
              label="Failed"
              value={props.run.stats.failedCount}
              highlight={props.run.stats.failedCount > 0}
              size="sm"
            />
          </dl>
        </CardContent>
        <CardFooter class="justify-between gap-3 text-xs text-muted-foreground">
          <div class="flex items-center gap-2 truncate">
            <Avatar
              size="sm"
              src={props.run.git.author.avatarUrl ?? null}
              fallback={authorInitials(props.run.git.author.name, props.run.git.author.email)}
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

export { RunCard };
