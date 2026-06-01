// Regression: the directive used to read `getComputedStyle(el).position` at
// mount time. For elements not fully attached when Solid runs `use:` callbacks
// some browsers return "" (not "static"), so the static-check skipped and the
// element never got `position: relative`. The ripple span's `position:
// absolute` then resolved against the nearest positioned ancestor (often the
// body) — circles landed in the screen corner instead of inside the button.
//
// Tests below click a fresh element and assert:
//  1. inline `position: relative` is stamped (so the span is contained).
//  2. inline `overflow: hidden` is stamped (so the span is clipped).
//  3. the span's geometry places it at the click point.

import { cleanup, render } from "@solidjs/testing-library";
import { afterEach, describe, expect, it } from "vitest";
import { ripple } from "./ripple";

// Tell TS that the directive is in use (Solid's `use:` syntax needs the
// imported symbol to survive tree-shaking even though we don't call it).
void ripple;

afterEach(() => cleanup());

function fireDown(el: Element, clientX: number, clientY: number) {
  // jsdom doesn't ship PointerEvent constructor, so build a typed event by
  // hand. addEventListener for "pointerdown" still receives this fine.
  const evt = new Event("pointerdown", { bubbles: true, cancelable: true });
  Object.assign(evt, { clientX, clientY, pointerType: "mouse" });
  el.dispatchEvent(evt);
}

function stubRect(el: HTMLElement, rect: Partial<DOMRect>) {
  // jsdom returns all zeros from getBoundingClientRect; stub the values we
  // need so the directive's math has something to work with.
  const r = { x: 0, y: 0, top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0, ...rect };
  el.getBoundingClientRect = () => r as DOMRect;
}

describe("ripple directive", () => {
  it("stamps inline position:relative + overflow:hidden on first pointerdown", () => {
    const { container } = render(() => (
      <button use:ripple type="button">
        x
      </button>
    ));
    const btn = container.querySelector("button");
    if (!btn) throw new Error("no button");
    stubRect(btn, { left: 100, top: 50, width: 80, height: 40, right: 180, bottom: 90 });
    expect(btn.style.position).toBe("");
    expect(btn.style.overflow).toBe("");

    fireDown(btn, 140, 70);

    expect(btn.style.position).toBe("relative");
    expect(btn.style.overflow).toBe("hidden");
  });

  it("centers the ripple span on the click point", () => {
    const { container } = render(() => (
      <button use:ripple type="button">
        x
      </button>
    ));
    const btn = container.querySelector("button");
    if (!btn) throw new Error("no button");
    stubRect(btn, { left: 100, top: 50, width: 80, height: 40, right: 180, bottom: 90 });

    fireDown(btn, 140, 70); // click 40 across, 20 down inside the button

    const span = btn.lastElementChild as HTMLElement | null;
    expect(span?.tagName).toBe("SPAN");
    // size = max(width, height) * 2 = 160
    // left = clickX - rect.left - size/2 = 40 - 80 = -40
    // top  = clickY - rect.top  - size/2 = 20 - 80 = -60
    expect(span?.style.width).toBe("160px");
    expect(span?.style.height).toBe("160px");
    expect(span?.style.left).toBe("-40px");
    expect(span?.style.top).toBe("-60px");
    expect(span?.style.position).toBe("absolute");
    expect(span?.style.borderRadius).toBe("50%");
  });

  it("doesn't stamp position when the host is already positioned via CSS", () => {
    const { container } = render(() => (
      <button use:ripple type="button" style={{ position: "absolute" }}>
        x
      </button>
    ));
    const btn = container.querySelector("button");
    if (!btn) throw new Error("no button");
    stubRect(btn, { left: 0, top: 0, width: 50, height: 50, right: 50, bottom: 50 });

    fireDown(btn, 25, 25);

    // Inline position was already "absolute" — leave it alone.
    expect(btn.style.position).toBe("absolute");
  });

  it("does not install a handler when value is falsy", () => {
    const { container } = render(() => (
      <button use:ripple={false} type="button">
        x
      </button>
    ));
    const btn = container.querySelector("button");
    if (!btn) throw new Error("no button");
    stubRect(btn, { left: 0, top: 0, width: 40, height: 40, right: 40, bottom: 40 });
    fireDown(btn, 20, 20);
    // No span appended, no inline position stamped.
    expect(btn.lastElementChild).toBeNull();
    expect(btn.style.position).toBe("");
  });

  it("applies a custom class to the ripple span when given as opts", () => {
    const { container } = render(() => (
      <button use:ripple={{ class: "bg-red-500" }} type="button">
        x
      </button>
    ));
    const btn = container.querySelector("button");
    if (!btn) throw new Error("no button");
    stubRect(btn, { left: 0, top: 0, width: 40, height: 40, right: 40, bottom: 40 });
    fireDown(btn, 20, 20);
    const span = btn.lastElementChild as HTMLElement | null;
    expect(span?.className).toBe("bg-red-500");
  });
});
