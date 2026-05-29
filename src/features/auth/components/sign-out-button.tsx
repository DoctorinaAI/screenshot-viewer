import { Show } from "solid-js";
import { useAuth } from "@/features/auth/store";
import { Avatar } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

function initialsFor(displayName: string | null, email: string | null) {
  const source = displayName ?? email ?? "?";
  const parts = source.split(/[\s.@]+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function SignOutMenu() {
  const auth = useAuth();
  return (
    <Show when={auth.user()}>
      {(user) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            as={Button}
            variant="ghost"
            size="icon"
            class="h-8 w-8 rounded-full p-0"
            aria-label="Account menu"
          >
            <Avatar
              size="sm"
              src={user().photoURL}
              alt={user().displayName ?? user().email ?? ""}
              fallback={initialsFor(user().displayName, user().email)}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <div class="grid gap-0.5">
                  <span class="font-medium">{user().displayName ?? "Doctorina engineer"}</span>
                  <span class="text-xs text-muted-foreground">{user().email}</span>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => {
                void auth.signOut();
              }}
            >
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </Show>
  );
}

export { SignOutMenu };
