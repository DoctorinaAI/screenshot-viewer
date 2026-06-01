import { createRoot } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";
import { createFakeAuthState, fakeSignInWithGoogle, fakeSignOut } from "@/shared/api/fake-auth";

describe("fake auth", () => {
  // The module holds a single shared currentUser signal — reset after each test
  // by signing back in so subsequent tests start from the "signed in" baseline.
  afterEach(async () => {
    await fakeSignInWithGoogle();
  });

  it("signInWithGoogle resolves with ok: true and the synthetic user", async () => {
    await fakeSignOut();
    const result = await fakeSignInWithGoogle();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.user.email).toBe("fake-engineer@doctorina.com");
      expect(result.user.emailVerified).toBe(true);
    }
  });

  it("signOut clears the shared current user", async () => {
    await fakeSignOut();
    // Re-poll the state via a fresh auth state and verify it's null.
    await new Promise<void>((resolve) => {
      createRoot((dispose) => {
        const auth = createFakeAuthState();
        // First poll: signal seeded with currentUser() at construction.
        expect(auth.user()).toBeNull();
        dispose();
        resolve();
      });
    });
  });

  it("createFakeAuthState reports loading: false immediately", () => {
    createRoot((dispose) => {
      const auth = createFakeAuthState();
      expect(auth.loading()).toBe(false);
      dispose();
    });
  });

  it("auth state polls and observes sign-in/sign-out across providers", async () => {
    await fakeSignOut();
    await new Promise<void>((resolve, reject) => {
      createRoot((dispose) => {
        const auth = createFakeAuthState();
        expect(auth.user()).toBeNull();

        // Trigger sign-in; expect user to become non-null within ~250ms.
        void fakeSignInWithGoogle();
        const start = Date.now();
        const tick = () => {
          if (auth.user()) {
            dispose();
            resolve();
            return;
          }
          if (Date.now() - start > 1000) {
            dispose();
            reject(new Error("auth state never observed sign-in"));
            return;
          }
          setTimeout(tick, 20);
        };
        tick();
      });
    });
  });
});
