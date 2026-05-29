import { createSignal, Show, splitProps } from "solid-js";
import { cn } from "@/shared/lib/cn";

interface AvatarProps {
  class?: string;
  src?: string | null;
  alt?: string;
  fallback: string;
  size?: "sm" | "default" | "lg";
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  default: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
} as const;

function Avatar(props: AvatarProps) {
  const [local] = splitProps(props, ["class", "src", "alt", "fallback", "size"]);
  const size = () => local.size ?? "default";
  const [errored, setErrored] = createSignal(false);

  return (
    <span
      class={cn(
        "relative flex shrink-0 overflow-hidden rounded-full",
        sizeClasses[size()],
        local.class,
      )}
    >
      <Show
        when={local.src && !errored()}
        fallback={
          <span class="flex h-full w-full items-center justify-center rounded-full bg-muted font-medium text-muted-foreground">
            {local.fallback}
          </span>
        }
      >
        <img
          class="aspect-square h-full w-full object-cover"
          src={local.src as string}
          alt={local.alt ?? local.fallback}
          onError={() => setErrored(true)}
        />
      </Show>
    </span>
  );
}

export type { AvatarProps };
export { Avatar };
