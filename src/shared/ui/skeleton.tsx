import type { JSX } from "solid-js";
import { splitProps } from "solid-js";
import { cn } from "@/shared/lib/cn";

function Skeleton(props: JSX.HTMLAttributes<HTMLDivElement>) {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <div
      class={cn("rounded-md bg-muted", local.class)}
      style={{
        "background-image":
          "linear-gradient(90deg, transparent 0%, color-mix(in oklch, var(--muted-foreground) 8%, transparent) 50%, transparent 100%)",
        "background-size": "200% 100%",
        animation: "shimmer 1.5s ease-in-out infinite",
      }}
      {...rest}
    />
  );
}

export { Skeleton };
