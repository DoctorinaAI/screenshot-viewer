import type { ParentProps } from "solid-js";
import { createSignal } from "solid-js";
import { AuthContext, type AuthContextValue } from "@/features/auth/store";
import {
  createAuthState,
  signOut as fbSignOut,
  type SignInResult,
  signInWithGoogle,
} from "@/shared/api/auth";

function AuthProvider(props: ParentProps) {
  const { user, loading } = createAuthState();

  const [signing, setSigning] = createSignal(false);
  const [lastError, setLastError] = createSignal<SignInResult | null>(null);

  const value: AuthContextValue = {
    user,
    loading,
    signing,
    lastError,
    async signIn() {
      setSigning(true);
      setLastError(null);
      try {
        const result = await signInWithGoogle();
        if (!result.ok) setLastError(result);
        return result;
      } finally {
        setSigning(false);
      }
    },
    async signOut() {
      setLastError(null);
      await fbSignOut();
    },
    clearError() {
      setLastError(null);
    },
  };

  return <AuthContext.Provider value={value}>{props.children}</AuthContext.Provider>;
}

export { AuthProvider };
