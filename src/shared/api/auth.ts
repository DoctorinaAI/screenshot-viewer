// Auth helpers. Sign-in goes through Google with hd=doctorina.com hint.
// The strict gate (verified email + matches @doctorina.com) lives in the
// Firestore + Storage rules — the client only enforces a UX-level check so
// non-matching accounts see a friendly "wrong domain" toast instead of every
// query silently failing with PERMISSION_DENIED.

import {
  signOut as fbSignOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  type User,
} from "firebase/auth";
import { createSignal, onCleanup } from "solid-js";
import { firebaseAuth } from "./firebase";

const DOCTORINA_EMAIL_REGEX = /^[^@]+@doctorina\.com$/;

export function isDoctorinaUser(user: User | null | undefined): boolean {
  if (!user) return false;
  if (!user.emailVerified) return false;
  if (!user.email) return false;
  return DOCTORINA_EMAIL_REGEX.test(user.email);
}

function buildGoogleProvider() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ hd: "doctorina.com", prompt: "select_account" });
  return provider;
}

export type SignInResult =
  | { ok: true; user: User }
  | { ok: false; reason: "wrong-domain"; email: string | null }
  | { ok: false; reason: "popup-blocked" | "cancelled" | "unknown"; error: unknown };

export async function signInWithGoogle(): Promise<SignInResult> {
  try {
    const cred = await signInWithPopup(firebaseAuth(), buildGoogleProvider());
    if (isDoctorinaUser(cred.user)) return { ok: true, user: cred.user };
    await fbSignOut(firebaseAuth());
    return { ok: false, reason: "wrong-domain", email: cred.user.email };
  } catch (error) {
    const code = (error as { code?: string } | null)?.code ?? "";
    if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
      return { ok: false, reason: "cancelled", error };
    }
    if (code === "auth/popup-blocked") return { ok: false, reason: "popup-blocked", error };
    return { ok: false, reason: "unknown", error };
  }
}

export function signOut(): Promise<void> {
  return fbSignOut(firebaseAuth());
}

// Reactive auth state. Use inside a Solid root (e.g. a provider component).
export function createAuthState() {
  const [user, setUser] = createSignal<User | null | undefined>(undefined);
  const unsubscribe = onAuthStateChanged(firebaseAuth(), (next) => {
    if (next && !isDoctorinaUser(next)) {
      // Foreign domain crept in (e.g. via a stale session). Don't expose it
      // to the app — sign the user out before flipping the signal.
      void fbSignOut(firebaseAuth()).then(() => setUser(null));
      return;
    }
    setUser(next);
  });
  onCleanup(unsubscribe);
  return {
    user,
    loading: () => user() === undefined,
  };
}
