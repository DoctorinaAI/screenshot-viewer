import { RunsList } from "@/features/runs/components/runs-list";
import { useT } from "@/shared/lib/i18n";

function HomePage() {
  const t = useT();
  return (
    <div class="grid gap-5">
      <header class="grid gap-1.5">
        <h1 class="select-none text-2xl font-semibold tracking-tight">{t("home.title")}</h1>
        <p class="select-none text-sm text-muted-foreground">{t("home.subtitle")}</p>
      </header>
      <RunsList />
    </div>
  );
}

export default HomePage;
