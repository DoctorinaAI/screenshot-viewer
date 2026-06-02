import type { ParentProps } from "solid-js";
import { AppBar } from "@/app/app-bar";
import { AppBarProvider } from "@/app/app-bar-context";

function AppLayout(props: ParentProps) {
  return (
    <AppBarProvider>
      {/*
        `overflow-x-clip` on the root container kills the brief horizontal
        scrollbar that appeared when a user resized the window from desktop
        down to mobile: an inner flex child briefly measures its
        min-content width before the next reflow shrinks it back. `clip` is
        preferable to `hidden` here — it doesn't create a new scroll
        container, so position:sticky on the app bar keeps working.
      */}
      <div class="flex min-h-dvh w-full min-w-0 flex-col overflow-x-clip">
        <AppBar />
        <main class="mx-auto w-full min-w-0 max-w-screen-2xl flex-1 px-3 py-5 sm:px-6 sm:py-8">
          {props.children}
        </main>
      </div>
    </AppBarProvider>
  );
}

export { AppLayout };
