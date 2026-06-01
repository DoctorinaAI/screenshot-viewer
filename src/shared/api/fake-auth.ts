// Fake auth backend. No Firebase, no popups, no network — the user is
// already "signed in" as a synthetic @doctorina.com engineer the moment
// createAuthState() is called. signOut flips the signal back to null and
// signInWithGoogle simulates a one-tick delay for realism.
//
// Only the shape that the rest of the app reads is reproduced: displayName,
// email, emailVerified, photoURL. The real `User` interface has dozens of
// other fields we never touch.

import type { User } from "firebase/auth";
import { createSignal, onCleanup } from "solid-js";
import type { SignInResult } from "./auth";

const FAKE_USER: User = {
  uid: "fake-engineer",
  displayName: "Doctorina Fake Engineer",
  email: "fake-engineer@doctorina.com",
  emailVerified: true,
  photoURL: null,
  phoneNumber: null,
  providerId: "google.com",
  isAnonymous: false,
  tenantId: null,
  metadata: {
    creationTime: undefined,
    lastSignInTime: undefined,
  },
  providerData: [],
  refreshToken: "fake-refresh-token",
  // The rest of the User surface (delete, getIdToken, reload, toJSON, …) is
  // never invoked from app code; cast through unknown to keep the typing
  // honest without re-implementing the SDK.
} as unknown as User;

// One shared signal so subscribers across createAuthState calls see the same
// state (mirrors Firebase's singleton Auth observer).
const [currentUser, setCurrentUser] = createSignal<User | null>(FAKE_USER);

export function fakeSignInWithGoogle(): Promise<SignInResult> {
  return new Promise((resolve) => {
    setTimeout(() => {
      setCurrentUser(FAKE_USER);
      resolve({ ok: true, user: FAKE_USER });
    }, 120);
  });
}

export function fakeSignOut(): Promise<void> {
  setCurrentUser(null);
  return Promise.resolve();
}

export function createFakeAuthState() {
  const [user, setUser] = createSignal<User | null | undefined>(currentUser());
  // Re-emit on global signal changes so each provider instance stays in sync.
  const interval = setInterval(() => {
    const next = currentUser();
    if (next !== user()) setUser(next);
  }, 80);
  onCleanup(() => clearInterval(interval));
  return {
    user,
    loading: () => false,
  };
}
