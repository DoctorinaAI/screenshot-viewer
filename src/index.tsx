/* @refresh reload */
import { render } from "solid-js/web";
import "./index.css";

function App() {
  return (
    <main class="grid min-h-dvh place-items-center px-6">
      <div class="max-w-prose space-y-4 text-center">
        <h1 class="text-3xl font-semibold tracking-tight">Doctorina · Screenshots</h1>
        <p class="text-muted-foreground">
          Bootstrap placeholder. The viewer SPA is not yet implemented — see{" "}
          <a
            class="underline underline-offset-4"
            href="https://github.com/DoctorinaAI/doctorina/issues/3695"
          >
            DoctorinaAI/doctorina#3695
          </a>{" "}
          and{" "}
          <a class="underline underline-offset-4" href="/ROADMAP.md">
            ROADMAP.md
          </a>
          .
        </p>
      </div>
    </main>
  );
}

const root = document.getElementById("root");
if (!root) throw new Error("#root not found");
render(() => <App />, root);
