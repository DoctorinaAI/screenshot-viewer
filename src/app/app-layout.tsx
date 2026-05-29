import { A } from "@solidjs/router";
import type { ParentProps } from "solid-js";
import { ThemeSwitcher } from "@/app/theme-switcher";

function AppLayout(props: ParentProps) {
  return (
    <div class="flex min-h-dvh flex-col">
      <header class="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div class="mx-auto flex h-14 w-full max-w-screen-2xl items-center gap-4 px-4 sm:px-6">
          <A href="/" class="flex items-center gap-2 font-semibold tracking-tight">
            <span aria-hidden="true" class="inline-block h-2.5 w-2.5 rounded-full bg-primary" />
            <span>Doctorina · Screenshots</span>
          </A>
          <nav class="ml-4 hidden gap-1 text-sm text-muted-foreground sm:flex">
            <A
              href="/"
              end
              class="rounded-md px-2 py-1 hover:bg-accent hover:text-foreground aria-[current=page]:text-foreground"
              activeClass="text-foreground"
            >
              Runs
            </A>
            <A
              href="/ui-kit"
              class="rounded-md px-2 py-1 hover:bg-accent hover:text-foreground aria-[current=page]:text-foreground"
              activeClass="text-foreground"
            >
              UI Kit
            </A>
          </nav>
          <div class="ml-auto">
            <ThemeSwitcher />
          </div>
        </div>
      </header>
      <main class="mx-auto w-full max-w-screen-2xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {props.children}
      </main>
    </div>
  );
}

export { AppLayout };
