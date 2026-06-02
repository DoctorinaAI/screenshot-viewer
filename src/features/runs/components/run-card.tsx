import { A } from "@solidjs/router";
import { For, Show } from "solid-js";
import { useT } from "@/shared/lib/i18n";
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

/**
 * Equal-height card. `[grid-auto-rows:1fr]` on the parent grid gives every
 * row the height of the tallest card, and `h-full` here makes each card fill
 * its row. Long commit subjects / branch names truncate with a tooltip;
 * long emails go to title attribute so nothing pushes the layout.
 */
function RunCard(props: RunCardProps) {
  const t = useT();
  const createdAtDate = () => props.run.createdAt.toDate();

  return (
    <A href={`/runs/${props.run.runId}`} class="block focus:outline-none">
      <Card interactive class="flex h-full select-none flex-col">
        <CardHeader class="gap-3 p-5 pb-3">
          <div class="flex min-w-0 flex-wrap items-center gap-1.5">
            <Badge variant={runStatusBadge(props.run.workflow.status)}>
              {props.run.workflow.status}
            </Badge>
            <Tooltip openDelay={400}>
              <TooltipTrigger
                as={Badge}
                variant="outline"
                class="max-w-[10rem] truncate font-mono text-[11px] uppercase tracking-wide"
              >
                {props.run.git.branch}
              </TooltipTrigger>
              <TooltipContent>{props.run.git.branch}</TooltipContent>
            </Tooltip>
            <Show when={props.run.pr}>
              {(pr) => (
                <Badge variant="secondary" class="font-mono text-[11px]">
                  PR #{pr().number}
                </Badge>
              )}
            </Show>
          </div>
          <Tooltip openDelay={500}>
            <TooltipTrigger
              as={CardTitle}
              class="line-clamp-2 min-h-[2.5rem] text-base font-medium leading-snug"
            >
              {props.run.git.commitSubject}
            </TooltipTrigger>
            <TooltipContent class="max-w-md">{props.run.git.commitSubject}</TooltipContent>
          </Tooltip>
          <CardDescription class="truncate font-mono text-[11px]">
            {props.run.git.commitShaShort} · v{props.run.app.version}
          </CardDescription>
        </CardHeader>
        <CardContent class="grid flex-1 gap-3 p-5 pt-0">
          <div class="flex min-w-0 flex-wrap items-center gap-1.5 text-xs">
            <For each={props.run.languages.slice(0, LANGUAGES_PREVIEW)}>
              {(lang) => (
                <span class="select-none rounded bg-muted px-1.5 py-0.5 font-mono uppercase text-muted-foreground">
                  {lang}
                </span>
              )}
            </For>
            <Show when={props.run.languages.length > LANGUAGES_PREVIEW}>
              <Tooltip openDelay={300}>
                <TooltipTrigger as="span" class="cursor-help text-muted-foreground">
                  +{props.run.languages.length - LANGUAGES_PREVIEW}
                </TooltipTrigger>
                <TooltipContent>
                  {props.run.languages.slice(LANGUAGES_PREVIEW).join(", ")}
                </TooltipContent>
              </Tooltip>
            </Show>
          </div>
          <dl class="grid grid-cols-3 gap-3 text-sm">
            <Stat label={t("run.stats.shots")} value={props.run.stats.totalShots} size="sm" />
            <Stat label={t("run.stats.unique")} value={props.run.stats.uniqueImages} size="sm" />
            <Stat
              label={t("run.stats.failed")}
              value={props.run.stats.failedCount}
              highlight={props.run.stats.failedCount > 0}
              size="sm"
            />
          </dl>
        </CardContent>
        <CardFooter class="justify-between gap-3 p-5 pt-3 text-xs text-muted-foreground">
          <div class="flex min-w-0 items-center gap-2">
            <Avatar
              size="sm"
              src={props.run.git.author.avatarUrl ?? null}
              fallback={authorInitials(props.run.git.author.name, props.run.git.author.email)}
            />
            <Tooltip openDelay={400}>
              <TooltipTrigger as="span" class="truncate" title={props.run.git.author.email}>
                {props.run.git.author.name}
              </TooltipTrigger>
              <TooltipContent>
                <div class="grid gap-0.5">
                  <span>{props.run.git.author.name}</span>
                  <span class="text-muted-foreground">{props.run.git.author.email}</span>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
          <Tooltip>
            <TooltipTrigger as="span" class="shrink-0 whitespace-nowrap">
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
