import { type Accessor, createEffect, onCleanup } from "solid-js";

declare module "solid-js" {
  namespace JSX {
    interface Directives {
      ripple: true | { class?: string } | false | undefined;
    }
  }
}

/**
 * Material-style ripple. Appends an absolutely-positioned `<span>` inside
 * the host on pointerdown and animates it from the click point.
 *
 * Layout fixups (position: relative, overflow: hidden) run at the FIRST
 * pointerdown rather than at mount: `getComputedStyle()` on elements that
 * aren't fully attached returns initial values in some browsers, which
 * makes the `position === "static"` check skip — the ripple span then
 * falls out of the host and lands wherever the nearest positioned
 * ancestor (often the body) sits. Click-time fixups are cheap (one extra
 * style read per click) and bulletproof.
 */
export function ripple(
  el: HTMLElement,
  value: Accessor<true | { class?: string } | false | undefined>,
) {
  function onPointerDown(e: PointerEvent) {
    // Check at click time so we read computed styles from a fully-attached,
    // fully-styled element. `style.position` is the inline value (empty if
    // unset), so we only stamp `relative` when the cascade truly resolves
    // to `static` and we haven't already stamped it.
    if (!el.style.position && getComputedStyle(el).position === "static") {
      el.style.position = "relative";
    }
    if (!el.style.overflow) {
      el.style.overflow = "hidden";
    }

    const rect = el.getBoundingClientRect();
    // Cover the diagonal so the ripple reaches every corner of the host
    // from any click point. Using max(w, h) * 2 over-covers slightly but
    // keeps the math cheap and avoids visible "dead zones" near corners.
    const size = Math.max(rect.width, rect.height) * 2;
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const span = document.createElement("span");
    span.style.cssText = `position:absolute;pointer-events:none;border-radius:50%;left:${x}px;top:${y}px;width:${size}px;height:${size}px;background:currentColor;opacity:0;animation:ripple-expand 600ms ease-out forwards;`;

    const opts = value();
    if (typeof opts === "object" && opts && opts.class) {
      span.className = opts.class;
    }

    el.appendChild(span);
    span.addEventListener("animationend", () => span.remove(), { once: true });
  }

  // React to value() toggling between truthy/falsy. Cards pass
  // `interactive || undefined`, so a Card that becomes interactive at
  // runtime starts emitting ripples without a remount.
  createEffect(() => {
    if (!value()) return;
    el.addEventListener("pointerdown", onPointerDown);
    onCleanup(() => el.removeEventListener("pointerdown", onPointerDown));
  });
}
