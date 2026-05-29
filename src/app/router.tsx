import { Route, Router } from "@solidjs/router";
import { lazy } from "solid-js";
import { AppLayout } from "@/app/app-layout";

const HomePage = lazy(() => import("@/pages/home"));
const UiKitPage = lazy(() => import("@/pages/ui-kit"));

function AppRouter() {
  return (
    <Router root={(props) => <AppLayout>{props.children}</AppLayout>}>
      <Route path="/" component={HomePage} />
      <Route path="/ui-kit" component={UiKitPage} />
      <Route path="*" component={NotFoundPage} />
    </Router>
  );
}

function NotFoundPage() {
  return (
    <div class="grid place-items-center py-24">
      <p class="text-muted-foreground">Page not found.</p>
    </div>
  );
}

export { AppRouter };
