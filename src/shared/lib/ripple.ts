import { type Accessor, onCleanup } from "solid-js";

declare module "solid-js" {
  namespace JSX {
    interface Directives {
      ripple: true | { class?: string } | false | undefined;
    }
  }
}

export function ripple(
  el: HTMLElement,
  value: Accessor<true | { class?: string } | false | undefined>,
) {
  if (!value()) return;

  const style = el.style;
  if (getComputedStyle(el).position === "static") {
    style.position = "relative";
  }
  style.overflow = "hidden";

  function onPointerDown(e: PointerEvent) {
    const rect = el.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const span = document.createElement("span");
    span.style.cssText = `
      position:absolute;pointer-events:none;border-radius:50%;
      left:${x}px;top:${y}px;width:${size}px;height:${size}px;
      background:currentColor;opacity:0;
      animation:ripple-expand 600ms ease-out forwards;
    `;

    const opts = value();
    if (typeof opts === "object" && opts.class) {
      span.className = opts.class;
    }

    el.appendChild(span);
    span.addEventListener("animationend", () => span.remove(), { once: true });
  }

  el.addEventListener("pointerdown", onPointerDown);
  onCleanup(() => el.removeEventListener("pointerdown", onPointerDown));
}
