import { DEFAULT_LOCALE } from "@/shared/lib/relative-time";
import { type RunDoc, RunStatus } from "@/shared/lib/schema";
import type { BadgeProps } from "@/shared/ui/badge";

interface StatProps {
  label: string;
  value: number;
  highlight?: boolean;
  size?: "sm" | "md";
}

function Stat(props: StatProps) {
  const size = () => props.size ?? "md";
  return (
    <div class="grid gap-0.5">
      <dt class="text-[10px] uppercase tracking-wide text-muted-foreground">{props.label}</dt>
      <dd
        class={`font-semibold tabular-nums ${size() === "sm" ? "text-base" : "text-lg"} ${
          props.highlight ? "text-status-failed" : "text-foreground"
        }`}
      >
        {props.value.toLocaleString(DEFAULT_LOCALE)}
      </dd>
    </div>
  );
}

function runStatusBadge(status: RunDoc["workflow"]["status"]): BadgeProps["variant"] {
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

export { authorInitials, runStatusBadge, Stat };
