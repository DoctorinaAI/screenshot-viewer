import { Show } from "solid-js";
import { formatFullDateTime, formatRelativeTime } from "@/shared/lib/relative-time";
import type { RunDoc } from "@/shared/lib/schema";
import { Avatar } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { authorInitials, runStatusBadge, Stat } from "./run-stat";

interface RunHeaderProps {
  run: RunDoc;
}

function RunHeader(props: RunHeaderProps) {
  const created = () => props.run.createdAt.toDate();
  return (
    <Card>
      <CardHeader class="gap-3">
        <div class="flex flex-wrap items-center gap-2 text-sm">
          <Badge variant={runStatusBadge(props.run.workflow.status)}>
            {props.run.workflow.status}
          </Badge>
          <Badge variant="outline" class="font-mono text-[11px] uppercase tracking-wide">
            {props.run.git.branch}
          </Badge>
          <Show when={props.run.pr}>
            {(pr) => (
              <a
                href={pr().url}
                target="_blank"
                rel="noopener noreferrer"
                class="text-muted-foreground underline-offset-2 hover:underline"
              >
                <Badge variant="secondary" class="font-mono text-[11px]">
                  PR #{pr().number}
                </Badge>
              </a>
            )}
          </Show>
          <span class="font-mono text-xs text-muted-foreground">
            {props.run.git.commitShaShort}
          </span>
          <span class="text-muted-foreground">·</span>
          <span class="font-mono text-xs text-muted-foreground">v{props.run.app.version}</span>
        </div>
        <CardTitle class="text-xl leading-snug">{props.run.git.commitSubject}</CardTitle>
      </CardHeader>
      <CardContent class="grid gap-4">
        <div class="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span class="flex items-center gap-2">
            <Avatar
              size="sm"
              src={props.run.git.author.avatarUrl ?? null}
              fallback={authorInitials(props.run.git.author.name, props.run.git.author.email)}
            />
            <span>{props.run.git.author.name}</span>
          </span>
          <span>·</span>
          <span title={formatFullDateTime(created())}>{formatRelativeTime(created())}</span>
          <span>·</span>
          <a
            href={props.run.workflow.runUrl}
            target="_blank"
            rel="noopener noreferrer"
            class="underline-offset-2 hover:underline"
          >
            Workflow run ↗
          </a>
        </div>
        <dl class="grid grid-cols-3 gap-4 sm:grid-cols-6">
          <Stat label="Shots" value={props.run.stats.totalShots} />
          <Stat label="Unique" value={props.run.stats.uniqueImages} />
          <Stat
            label="Failed"
            value={props.run.stats.failedCount}
            highlight={props.run.stats.failedCount > 0}
          />
          <Stat label="Languages" value={props.run.languages.length} />
          <Stat label="Layouts" value={props.run.layouts.length} />
          <Stat label="Platforms" value={props.run.platforms.length} />
        </dl>
      </CardContent>
    </Card>
  );
}

export { RunHeader };
