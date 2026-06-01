import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("joins plain strings", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });

  it("drops falsy values", () => {
    expect(cn("a", false, null, undefined, "", "b")).toBe("a b");
  });

  it("supports clsx-style objects and arrays", () => {
    expect(cn("a", { b: true, c: false }, ["d", { e: true }])).toBe("a b d e");
  });

  it("dedupes conflicting tailwind utilities — last wins", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("text-sm text-foreground", "text-base")).toBe("text-foreground text-base");
  });

  it("preserves non-conflicting tailwind utilities", () => {
    expect(cn("rounded-lg border", "p-4")).toBe("rounded-lg border p-4");
  });
});
