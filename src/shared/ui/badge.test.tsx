import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { Badge } from "./badge";

describe("Badge", () => {
  it("renders children inside a <div>", () => {
    const { container } = render(() => <Badge>1.0.0</Badge>);
    const el = container.firstElementChild as HTMLElement;
    expect(el.tagName).toBe("DIV");
    expect(el.textContent).toBe("1.0.0");
  });

  it("applies default variant styles", () => {
    const { container } = render(() => <Badge>X</Badge>);
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toMatch(/bg-primary/);
  });

  it("supports the status-colored variants used by run cards", () => {
    const variants = ["ok", "warning", "failed"] as const;
    for (const variant of variants) {
      const { container } = render(() => <Badge variant={variant}>X</Badge>);
      const el = container.firstElementChild as HTMLElement;
      expect(el.className).toMatch(new RegExp(`bg-status-${variant}`));
    }
  });

  it("forwards arbitrary attributes (title, aria-*) without dropping them", () => {
    const { container } = render(() => (
      <Badge title="hover me" aria-label="status">
        X
      </Badge>
    ));
    const el = container.firstElementChild as HTMLElement;
    expect(el.getAttribute("title")).toBe("hover me");
    expect(el.getAttribute("aria-label")).toBe("status");
  });
});
