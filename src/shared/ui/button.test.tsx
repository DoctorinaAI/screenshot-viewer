import { fireEvent, render } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./button";

describe("Button", () => {
  it("renders its children as a <button>", () => {
    const { getByRole } = render(() => <Button>Save</Button>);
    const el = getByRole("button");
    expect(el.tagName).toBe("BUTTON");
    expect(el.textContent).toBe("Save");
  });

  it("applies default variant + size classes", () => {
    const { getByRole } = render(() => <Button>X</Button>);
    const el = getByRole("button");
    expect(el.className).toMatch(/bg-primary/);
    expect(el.className).toMatch(/h-10/);
  });

  it("merges caller class via cn() — variant lives alongside caller utilities", () => {
    const { getByRole } = render(() => <Button class="mt-4 px-12">X</Button>);
    const el = getByRole("button");
    expect(el.className).toMatch(/mt-4/);
    expect(el.className).toMatch(/px-12/);
  });

  it("applies variant=outline classes", () => {
    const { getByRole } = render(() => <Button variant="outline">X</Button>);
    expect(getByRole("button").className).toMatch(/border-input/);
  });

  it("applies size=sm height + padding", () => {
    const { getByRole } = render(() => <Button size="sm">X</Button>);
    const el = getByRole("button");
    expect(el.className).toMatch(/h-9/);
    expect(el.className).toMatch(/px-3/);
  });

  it("forwards onClick", () => {
    const onClick = vi.fn();
    const { getByRole } = render(() => <Button onClick={onClick}>X</Button>);
    fireEvent.click(getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("forwards the disabled attribute and skips clicks while disabled", () => {
    const onClick = vi.fn();
    const { getByRole } = render(() => (
      <Button onClick={onClick} disabled>
        X
      </Button>
    ));
    const el = getByRole("button") as HTMLButtonElement;
    expect(el.disabled).toBe(true);
    fireEvent.click(el);
    expect(onClick).not.toHaveBeenCalled();
  });
});
