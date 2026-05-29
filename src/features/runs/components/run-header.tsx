import { Show } from "solid-js";
import { formatFullDateTime, formatRelativeTime } from "@/shared/lib/relative-time";
import { type RunDoc, RunStatus } from "@/shared/lib/schema";
import { Avatar } from "@/shared/ui/avatar";
import { Badge, type BadgeProps } from "@/shared/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";

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

function authorInitials(name: string, email: string): string {
  const source = name || email;
  const parts = source.split(/[\s.@]+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

interface RunHeaderProps {
  run: RunDoc;
}

function RunHeader(props: RunHeaderProps) {
  const created = () => props.run.createdAt.toDate();
  return (
    <Card>
      <CardHeader class="gap-3">
        <div class="flex flex-wrap items-center gap-2 text-sm">
          <Badge variant={statusBadge(props.run.workflow.status)}>
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

function Stat(props: { label: string; value: number; highlight?: boolean }) {
  return (
    <div class="grid gap-0.5">
      <dt class="text-[10px] uppercase tracking-wide text-muted-foreground">{props.label}</dt>
      <dd
        class={`text-lg font-semibold tabular-nums ${
          props.highlight ? "text-status-failed" : "text-foreground"
        }`}
      >
        {props.value.toLocaleString("en-GB")}
      </dd>
    </div>
  );
}

export { RunHeader };
