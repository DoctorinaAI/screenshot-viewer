import type { ParentProps } from "solid-js";
import { AppBar } from "@/app/app-bar";
import { AppBarProvider } from "@/app/app-bar-context";

function AppLayout(props: ParentProps) {
  return (
    <AppBarProvider>
      <div class="flex min-h-dvh flex-col">
        <AppBar />
        <main class="mx-auto w-full max-w-screen-2xl flex-1 px-3 py-5 sm:px-6 sm:py-8">
          {props.children}
        </main>
      </div>
    </AppBarProvider>
  );
}

export { AppLayout };
