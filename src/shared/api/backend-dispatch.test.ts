// Verifies that the public auth/runs/storage APIs dispatch to the fake-*
// implementations when USE_FAKE_BACKEND is true. We mock the backend module
// itself to flip the constant, and mock the fake-* siblings to assert the
// dispatch happens.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.doUnmock("@/shared/api/backend");
  vi.doUnmock("@/shared/api/fake-runs");
  vi.doUnmock("@/shared/api/fake-storage");
  vi.doUnmock("@/shared/api/fake-auth");
});

describe("USE_FAKE_BACKEND dispatch", () => {
  it("queryRuns delegates to fakeQueryRuns when USE_FAKE_BACKEND is true", async () => {
    vi.doMock("@/shared/api/backend", () => ({ USE_FAKE_BACKEND: true }));
    const stub = vi.fn(async () => ({ runs: [], lastDoc: null, hasMore: false }));
    vi.doMock("@/shared/api/fake-runs", () => ({
      fakeQueryRuns: stub,
      fakeGetRun: vi.fn(),
    }));

    const { queryRuns } = await import("@/shared/api/runs");
    await queryRuns({});
    expect(stub).toHaveBeenCalledOnce();
  });

  it("getRun delegates to fakeGetRun when USE_FAKE_BACKEND is true", async () => {
    vi.doMock("@/shared/api/backend", () => ({ USE_FAKE_BACKEND: true }));
    const stub = vi.fn(async () => null);
    vi.doMock("@/shared/api/fake-runs", () => ({
      fakeQueryRuns: vi.fn(),
      fakeGetRun: stub,
    }));

    const { getRun } = await import("@/shared/api/runs");
    await getRun("anything");
    expect(stub).toHaveBeenCalledWith("anything");
  });

  it("fetchManifest delegates to fakeFetchManifest when USE_FAKE_BACKEND is true", async () => {
    vi.doMock("@/shared/api/backend", () => ({ USE_FAKE_BACKEND: true }));
    const fetchStub = vi.fn(async () => ({}) as never);
    vi.doMock("@/shared/api/fake-storage", () => ({
      fakeFetchManifest: fetchStub,
      fakeFetchImagesArchive: vi.fn(),
      fakeReleaseImages: vi.fn(),
    }));

    const { fetchManifest } = await import("@/shared/api/storage");
    await fetchManifest("gs://fake-bucket/runs/r-x/manifest.json");
    expect(fetchStub).toHaveBeenCalledWith("gs://fake-bucket/runs/r-x/manifest.json");
  });

  it("releaseImages delegates to fakeReleaseImages when USE_FAKE_BACKEND is true", async () => {
    vi.doMock("@/shared/api/backend", () => ({ USE_FAKE_BACKEND: true }));
    const releaseStub = vi.fn();
    vi.doMock("@/shared/api/fake-storage", () => ({
      fakeFetchManifest: vi.fn(),
      fakeFetchImagesArchive: vi.fn(),
      fakeReleaseImages: releaseStub,
    }));

    const { releaseImages } = await import("@/shared/api/storage");
    const { createSignal } = await import("solid-js");
    const [thumbs] = createSignal(new Map<string, string>());
    releaseImages({ urls: new Map(), thumbs });
    expect(releaseStub).toHaveBeenCalledOnce();
  });

  it("signInWithGoogle and signOut delegate to fake-auth when USE_FAKE_BACKEND is true", async () => {
    vi.doMock("@/shared/api/backend", () => ({ USE_FAKE_BACKEND: true }));
    const signIn = vi.fn(async () => ({ ok: true, user: { email: "x" } }) as never);
    const signOut = vi.fn(async () => undefined);
    vi.doMock("@/shared/api/fake-auth", () => ({
      fakeSignInWithGoogle: signIn,
      fakeSignOut: signOut,
      createFakeAuthState: vi.fn(),
    }));

    const auth = await import("@/shared/api/auth");
    await auth.signInWithGoogle();
    await auth.signOut();
    expect(signIn).toHaveBeenCalledOnce();
    expect(signOut).toHaveBeenCalledOnce();
  });

  it("createAuthState delegates to createFakeAuthState when USE_FAKE_BACKEND is true", async () => {
    vi.doMock("@/shared/api/backend", () => ({ USE_FAKE_BACKEND: true }));
    const fakeState = vi.fn(() => ({
      user: () => null,
      loading: () => false,
    }));
    vi.doMock("@/shared/api/fake-auth", () => ({
      fakeSignInWithGoogle: vi.fn(),
      fakeSignOut: vi.fn(),
      createFakeAuthState: fakeState,
    }));

    const auth = await import("@/shared/api/auth");
    auth.createAuthState();
    expect(fakeState).toHaveBeenCalledOnce();
  });
});
