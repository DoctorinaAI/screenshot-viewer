import { Route, Router } from "@solidjs/router";
import type { Component, ParentProps } from "solid-js";
import { lazy } from "solid-js";
import { AppLayout } from "@/app/app-layout";
import { AuthProvider } from "@/features/auth/components/auth-provider";
import { ProtectedRoute } from "@/features/auth/components/protected-route";

const HomePage = lazy(() => import("@/pages/home"));
const UiKitPage = lazy(() => import("@/pages/ui-kit"));
const LoginPage = lazy(() => import("@/pages/login"));

function AppRouter() {
  return (
    <Router root={Root}>
      <Route path="/login" component={LoginPage} />
      <Route path="/" component={Guard(HomePage)} />
      <Route path="/ui-kit" component={Guard(UiKitPage)} />
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
  return (
    <div class="grid place-items-center py-24">
      <p class="text-muted-foreground">Page not found.</p>
    </div>
  );
}

export { AppRouter };
