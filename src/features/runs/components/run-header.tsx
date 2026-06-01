import { createSignal, Show } from "solid-js";
import { useT } from "@/shared/lib/i18n";
import { formatFullDateTime, formatRelativeTime } from "@/shared/lib/relative-time";
import type { RunDoc } from "@/shared/lib/schema";
import { Avatar } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import { authorInitials, runStatusBadge, Stat } from "./run-stat";

interface RunHeaderProps {
  run: RunDoc;
}

function RunHeader(props: RunHeaderProps) {
  const t = useT();
  const created = () => props.run.createdAt.toDate();
  return (
    <Card>
      <CardHeader class="gap-3">
        <div class="flex min-w-0 flex-wrap items-center gap-2 text-sm">
          <Badge variant={runStatusBadge(props.run.workflow.status)}>
            {props.run.workflow.status}
          </Badge>
          <Tooltip openDelay={400}>
            <TooltipTrigger
              as={Badge}
              variant="outline"
              class="max-w-[14rem] truncate font-mono text-[11px] uppercase tracking-wide"
            >
              {props.run.git.branch}
            </TooltipTrigger>
            <TooltipContent>{props.run.git.branch}</TooltipContent>
          </Tooltip>
          <Show when={props.run.pr}>
            {(pr) => (
              <a
                href={pr().url}
                target="_blank"
                rel="noopener noreferrer"
                class="text-muted-foreground underline-offset-2 hover:underline"
                aria-label={`${t("run.openPR")} #${pr().number}`}
              >
                <Badge variant="secondary" class="font-mono text-[11px]">
                  PR #{pr().number}
                </Badge>
              </a>
            )}
          </Show>
          <CopyButton label={t("run.copyCommit")} value={props.run.git.commitSha}>
            <span class="font-mono text-xs">{props.run.git.commitShaShort}</span>
          </CopyButton>
          <span class="select-none text-muted-foreground">·</span>
          <span class="select-none font-mono text-xs text-muted-foreground">
            v{props.run.app.version}
          </span>
        </div>
        <CardTitle class="text-xl leading-snug">{props.run.git.commitSubject}</CardTitle>
      </CardHeader>
      <CardContent class="grid gap-4">
        <div class="flex min-w-0 flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span class="flex min-w-0 items-center gap-2">
            <Avatar
              size="sm"
              src={props.run.git.author.avatarUrl ?? null}
              fallback={authorInitials(props.run.git.author.name, props.run.git.author.email)}
            />
            <span class="truncate" title={props.run.git.author.email}>
              {props.run.git.author.name}
            </span>
          </span>
          <span class="select-none">·</span>
          <span title={formatFullDateTime(created())}>{formatRelativeTime(created())}</span>
          <span class="select-none">·</span>
          <Tooltip openDelay={400}>
            <TooltipTrigger
              as="a"
              href={props.run.workflow.runUrl}
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1 underline-offset-2 hover:underline"
            >
              {t("run.openWorkflow")}
              <ExternalIcon />
            </TooltipTrigger>
            <TooltipContent>{t("common.openInNewTab")}</TooltipContent>
          </Tooltip>
          <CopyButton
            label={t("run.copyLink")}
            value={typeof window !== "undefined" ? window.location.href : ""}
          >
            <span class="inline-flex items-center gap-1 select-none">
              <LinkIcon />
              <span class="hidden sm:inline">{t("run.copyLink")}</span>
            </span>
          </CopyButton>
        </div>
        <dl class="grid grid-cols-3 gap-3 text-sm sm:grid-cols-6">
          <Stat label={t("run.stats.shots")} value={props.run.stats.totalShots} />
          <Stat label={t("run.stats.unique")} value={props.run.stats.uniqueImages} />
          <Stat
            label={t("run.stats.failed")}
            value={props.run.stats.failedCount}
            highlight={props.run.stats.failedCount > 0}
          />
          <Stat label={t("run.stats.languages")} value={props.run.languages.length} />
          <Stat label={t("run.stats.layouts")} value={props.run.layouts.length} />
          <Stat label={t("run.stats.platforms")} value={props.run.platforms.length} />
        </dl>
      </CardContent>
    </Card>
  );
}

function CopyButton(props: {
  label: string;
  value: string;
  children: import("solid-js").JSX.Element;
}) {
  const t = useT();
  const [copied, setCopied] = createSignal(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(props.value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* ignore — older browsers without clipboard API */
    }
  };
  return (
    <Tooltip openDelay={300}>
      <TooltipTrigger
        as={Button}
        type="button"
        variant="ghost"
        size="sm"
        class="h-7 select-none gap-1 px-1.5 text-xs"
        onClick={copy}
        aria-label={props.label}
      >
        {props.children}
      </TooltipTrigger>
      <TooltipContent>
        <Show when={copied()} fallback={props.label}>
          {t("common.copied")}
        </Show>
      </TooltipContent>
    </Tooltip>
  );
}

function ExternalIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="h-3 w-3"
      aria-hidden="true"
    >
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="h-3.5 w-3.5"
      aria-hidden="true"
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

export { RunHeader };
