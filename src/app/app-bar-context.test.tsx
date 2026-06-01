import { render } from "@solidjs/testing-library";
import { type JSX, onMount } from "solid-js";
import { describe, expect, it } from "vitest";
import {
  type AppBarBack,
  type AppBarFilters,
  AppBarProvider,
  useAppBar,
  useRegisterBack,
  useRegisterFilters,
} from "./app-bar-context";

function withProvider(child: () => JSX.Element) {
  return render(() => <AppBarProvider>{child()}</AppBarProvider>);
}

describe("AppBarProvider + useAppBar", () => {
  it("initially exposes null back and filters", () => {
    let captured!: ReturnType<typeof useAppBar>;
    withProvider(() => {
      const Probe = () => {
        captured = useAppBar();
        return null;
      };
      return <Probe />;
    });
    expect(captured.back()).toBeNull();
    expect(captured.filters()).toBeNull();
  });

  it("useAppBar throws when used outside the provider", () => {
    expect(() => {
      render(() => {
        useAppBar();
        return null;
      });
    }).toThrow(/AppBarProvider/);
  });

  it("setBack and setFilters are reactive", () => {
    let captured!: ReturnType<typeof useAppBar>;
    withProvider(() => {
      const Probe = () => {
        captured = useAppBar();
        return null;
      };
      return <Probe />;
    });
    const back: AppBarBack = { href: "/", labelKey: "nav.back" };
    const filters: AppBarFilters = { labelKey: "filters.title", content: () => null };
    captured.setBack(back);
    captured.setFilters(filters);
    expect(captured.back()).toEqual(back);
    expect(captured.filters()).toEqual(filters);
    captured.setBack(null);
    expect(captured.back()).toBeNull();
  });
});

describe("useRegisterBack", () => {
  it("sets the back slot and clears it on cleanup", () => {
    let bar!: ReturnType<typeof useAppBar>;
    const back: AppBarBack = { href: "/", labelKey: "nav.back" };
    const Inner = () => {
      useRegisterBack(() => back);
      return null;
    };
    const Probe = () => {
      bar = useAppBar();
      return <Inner />;
    };
    const { unmount } = withProvider(() => <Probe />);
    expect(bar.back()).toEqual(back);
    unmount();
    expect(bar.back()).toBeNull();
  });
});

describe("useRegisterFilters", () => {
  it("sets the filters slot and clears it on cleanup", () => {
    let bar!: ReturnType<typeof useAppBar>;
    const filters: AppBarFilters = { labelKey: "filters.title", content: () => null };
    const Inner = () => {
      // onMount keeps the registration tied to the component lifetime even
      // though useRegisterFilters itself is a synchronous setter.
      onMount(() => undefined);
      useRegisterFilters(filters);
      return null;
    };
    const Probe = () => {
      bar = useAppBar();
      return <Inner />;
    };
    const { unmount } = withProvider(() => <Probe />);
    expect(bar.filters()).toEqual(filters);
    unmount();
    expect(bar.filters()).toBeNull();
  });
});
