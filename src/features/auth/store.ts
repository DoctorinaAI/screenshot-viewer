// Auth context + useAuth hook. The provider that actually populates this
// lives in `./components/auth-provider.tsx`; this module just defines the
// shape so consumers can import without dragging Firebase into their bundle.

import type { User } from "firebase/auth";
import { createContext, useContext } from "solid-js";
import type { SignInResult } from "@/shared/api/auth";

export interface AuthContextValue {
  // Reactive user state.
  // undefined = still resolving the initial onAuthStateChanged callback.
  // null      = signed out (or rejected by the domain guard).
  // User      = signed in + verified + @doctorina.com.
  user: () => User | null | undefined;
  loading: () => boolean;

  // In-flight sign-in pending state.
  signing: () => boolean;
  lastError: () => SignInResult | null;

  // Actions.
  signIn: () => Promise<SignInResult>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue>();

export { AuthContext };

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error(
      "useAuth must be used inside <AuthProvider>. Wrap the app (or at least the routes that need auth) in the provider in src/app/router.tsx.",
    );
  }
  return ctx;
}
