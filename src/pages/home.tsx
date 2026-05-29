import { RunsList } from "@/features/runs/components/runs-list";

function HomePage() {
  return (
    <div class="grid gap-6">
      <header class="grid gap-1.5">
        <h1 class="text-2xl font-semibold tracking-tight">Runs</h1>
        <p class="text-sm text-muted-foreground">
          Integration-test screenshot artifacts from CI. Newest first.
        </p>
      </header>
      <RunsList />
    </div>
  );
}

export default HomePage;
