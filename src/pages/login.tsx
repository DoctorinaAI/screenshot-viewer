import { Navigate } from "@solidjs/router";
import { Show } from "solid-js";
import { SignInForm } from "@/features/auth/components/sign-in-form";
import { useAuth } from "@/features/auth/store";

function LoginPage() {
  const auth = useAuth();
  return (
    <Show when={!auth.loading()} fallback={null}>
      <Show when={!auth.user()} fallback={<Navigate href="/" />}>
        <div class="grid place-items-center py-16">
          <SignInForm />
        </div>
      </Show>
    </Show>
  );
}

export default LoginPage;
