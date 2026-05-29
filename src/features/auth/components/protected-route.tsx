import { Navigate } from "@solidjs/router";
import type { ParentProps } from "solid-js";
import { Show } from "solid-js";
import { useAuth } from "@/features/auth/store";
import { Skeleton } from "@/shared/ui/skeleton";

function ProtectedRoute(props: ParentProps) {
  const auth = useAuth();
  return (
    <Show
      when={!auth.loading()}
      fallback={
        <div class="grid gap-4 py-12">
          <Skeleton class="h-8 w-1/3" />
          <Skeleton class="h-4 w-1/2" />
          <Skeleton class="h-64 w-full" />
        </div>
      }
    >
      <Show when={auth.user()} fallback={<Navigate href="/login" />}>
        {props.children}
      </Show>
    </Show>
  );
}

export { ProtectedRoute };
