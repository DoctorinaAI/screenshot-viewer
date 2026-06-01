import { Match, Show, Switch } from "solid-js";
import { useAuth } from "@/features/auth/store";
import { useT } from "@/shared/lib/i18n";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";

function SignInForm() {
  const auth = useAuth();
  const t = useT();
  const errorReason = () => {
    const e = auth.lastError();
    return e && !e.ok ? e.reason : null;
  };

  return (
    <Card class="w-full max-w-md">
      <CardHeader class="text-center">
        <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <span aria-hidden="true" class="h-3 w-3 rounded-full bg-primary" />
        </div>
        <CardTitle class="text-2xl">{t("brand.name")}</CardTitle>
        <CardDescription>{t("login.tagline")}</CardDescription>
      </CardHeader>
      <CardContent class="grid gap-4">
        <Button
          type="button"
          variant="default"
          size="lg"
          class="w-full"
          disabled={auth.signing()}
          onClick={() => {
            void auth.signIn();
          }}
        >
          <Show
            when={auth.signing()}
            fallback={
              <>
                <GoogleIcon />
                {t("login.signIn")}
              </>
            }
          >
            {t("login.signingIn")}
          </Show>
        </Button>
        <Show when={errorReason()}>
          <div
            role="alert"
            class="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            <Switch>
              <Match when={errorReason() === "wrong-domain"}>{t("login.err.wrongDomain")}</Match>
              <Match when={errorReason() === "popup-blocked"}>{t("login.err.popupBlocked")}</Match>
              <Match when={errorReason() === "cancelled"}>{t("login.err.cancelled")}</Match>
              <Match when={errorReason() === "unknown"}>{t("login.err.unknown")}</Match>
            </Switch>
          </div>
        </Show>
      </CardContent>
    </Card>
  );
}

function GoogleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="h-4 w-4" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 11v3.2h4.5c-.2 1.2-1.4 3.5-4.5 3.5-2.7 0-4.9-2.2-4.9-5s2.2-5 4.9-5c1.5 0 2.6.6 3.2 1.2l2.2-2.1C15.9 5.4 14.1 4.6 12 4.6 7.9 4.6 4.6 7.9 4.6 12s3.3 7.4 7.4 7.4c4.3 0 7.1-3 7.1-7.2 0-.5 0-.8-.1-1.2H12Z"
      />
    </svg>
  );
}

export { SignInForm };
