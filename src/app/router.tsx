import { Route, Router } from "@solidjs/router";
import type { Component, ParentProps } from "solid-js";
import { lazy } from "solid-js";
import { AppLayout } from "@/app/app-layout";
import { AuthProvider } from "@/features/auth/components/auth-provider";
import { ProtectedRoute } from "@/features/auth/components/protected-route";
import { useT } from "@/shared/lib/i18n";

const HomePage = lazy(() => import("@/pages/home"));
const UiKitPage = lazy(() => import("@/pages/ui-kit"));
const LoginPage = lazy(() => import("@/pages/login"));
const RunPage = lazy(() => import("@/pages/run"));

function AppRouter() {
  return (
    <Router root={Root}>
      <Route path="/login" component={LoginPage} />
      <Route path="/" component={Guard(HomePage)} />
      <Route path="/ui-kit" component={Guard(UiKitPage)} />
      <Route path="/runs/:runId" component={Guard(RunPage)} />
      <Route path="*" component={NotFoundPage} />
    </Router>
  );
}

function Root(props: ParentProps) {
  return (
    <AuthProvider>
      <AppLayout>{props.children}</AppLayout>
    </AuthProvider>
  );
}

function Guard(Page: Component): Component {
  return () => (
    <ProtectedRoute>
      <Page />
    </ProtectedRoute>
  );
}

function NotFoundPage() {
  const t = useT();
  return (
    <div class="grid place-items-center py-24">
      <p class="text-muted-foreground">{t("common.notFound")}</p>
    </div>
  );
}

export { AppRouter };
