import type { User } from "firebase/auth";
import { describe, expect, it } from "vitest";
import { isDoctorinaUser } from "@/shared/api/auth";

function makeUser(over: Partial<User>): User {
  return {
    uid: "u",
    email: null,
    emailVerified: false,
    displayName: null,
    photoURL: null,
    phoneNumber: null,
    providerId: "google.com",
    isAnonymous: false,
    tenantId: null,
    metadata: { creationTime: undefined, lastSignInTime: undefined },
    providerData: [],
    refreshToken: "",
    ...over,
  } as unknown as User;
}

describe("isDoctorinaUser", () => {
  it("rejects null/undefined", () => {
    expect(isDoctorinaUser(null)).toBe(false);
    expect(isDoctorinaUser(undefined)).toBe(false);
  });

  it("rejects unverified emails", () => {
    expect(isDoctorinaUser(makeUser({ email: "x@doctorina.com", emailVerified: false }))).toBe(
      false,
    );
  });

  it("rejects missing email", () => {
    expect(isDoctorinaUser(makeUser({ email: null, emailVerified: true }))).toBe(false);
  });

  it("rejects foreign domain", () => {
    expect(isDoctorinaUser(makeUser({ email: "x@gmail.com", emailVerified: true }))).toBe(false);
    expect(isDoctorinaUser(makeUser({ email: "x@doctorina.io", emailVerified: true }))).toBe(false);
  });

  it("rejects spoofed addresses that contain @doctorina.com but don't end with it", () => {
    expect(
      isDoctorinaUser(makeUser({ email: "x@doctorina.com.attacker.com", emailVerified: true })),
    ).toBe(false);
    expect(
      isDoctorinaUser(makeUser({ email: "evil+x@doctorina.com@gmail.com", emailVerified: true })),
    ).toBe(false);
  });

  it("accepts verified @doctorina.com address", () => {
    expect(isDoctorinaUser(makeUser({ email: "mike@doctorina.com", emailVerified: true }))).toBe(
      true,
    );
  });
});
