import { cleanup, fireEvent, render, within } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Shot } from "@/features/runs/manifest-helpers";
import type { ManifestIndex } from "@/features/runs/run-store";
import type { ImagesArchive } from "@/shared/api/storage";
import { Platform, ShotStatus, Theme } from "@/shared/lib/schema";
import { ShotLightbox } from "./shot-lightbox";

function makeShot(over: Partial<Shot>): Shot {
  return {
    id: over.id ?? "s",
    caseId: "login",
    layoutId: "iphone-15",
    languageCode: "en",
    theme: Theme.Light,
    platform: Platform.Ios,
    imageHash: over.id ?? "hash-x",
    capturedAt: "2026-06-01T00:00:00Z",
    status: ShotStatus.Ok,
    ...over,
  };
}

function makeIndex(shots: Shot[]): ManifestIndex {
  return {
    cases: new Map(
      shots.map((s) => [
        s.caseId,
        { id: s.caseId, title: s.caseId.toUpperCase(), description: undefined },
      ]),
    ),
    layouts: new Map(
      shots.map((s) => [
        s.layoutId,
        {
          id: s.layoutId,
          name: s.layoutId,
          width: 390,
          height: 844,
          dpr: 3,
          orientation: "portrait",
        },
      ]),
    ),
    languages: new Map(
      shots.map((s) => [
        s.languageCode,
        { code: s.languageCode, name: s.languageCode, direction: "ltr" },
      ]),
    ),
  };
}

function makeArchive(shots: Shot[]): ImagesArchive {
  const urls = new Map(shots.map((s) => [s.imageHash, `blob:fake/${s.imageHash}`]));
  const [thumbs] = createSignal(new Map<string, string>());
  return { urls, thumbs };
}

describe("ShotLightbox compare modes", () => {
  // Kobalte's Dialog portals into document.body, outside the render container.
  // The auto-cleanup unmounts the source tree but Kobalte's portaled nodes
  // can linger between tests, so clear document.body manually on each run.
  beforeEach(() => {
    document.body.innerHTML = "";
  });
  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
  });

  // Query through document.body via within() since the dialog content lives
  // outside the render container.
  function setup(initialIndex: number = 0) {
    const shots = [
      makeShot({ id: "s1", caseId: "alpha" }),
      makeShot({ id: "s2", caseId: "beta" }),
      makeShot({ id: "s3", caseId: "gamma" }),
      makeShot({ id: "s4", caseId: "delta" }),
    ];
    const [idx, setIdx] = createSignal<number | null>(initialIndex);
    const view = render(() => (
      <ShotLightbox
        index={makeIndex(shots)}
        archive={makeArchive(shots)}
        shots={shots}
        shotIndex={idx()}
        onChangeIndex={(n) => setIdx(n)}
      />
    ));
    return { ...view, shots, idx, setIdx, body: () => within(document.body) };
  }

  it("starts in single mode with one image and no Current badge", async () => {
    const { body } = setup(0);
    await body().findByText("ALPHA");
    expect(body().queryByTestId("lightbox-current-badge")).toBeNull();
  });

  it("after pinning both 1 and 2 on the current shot, shows diff mode with the Current badge", async () => {
    const { body } = setup(0);
    await body().findByText("ALPHA");
    fireEvent.keyDown(window, { key: "1" });
    fireEvent.keyDown(window, { key: "2" });
    expect(body().queryByTestId("lightbox-current-badge")).not.toBeNull();
  });

  it("arrowing past both pins switches into diff-unpaired (3-pane) mode keeping the current shot visible", async () => {
    const { body } = setup(0);
    await body().findByText("ALPHA");

    // Pin slot 1 on shot 0 (alpha), then move to shot 1 (beta) and pin slot 2.
    fireEvent.keyDown(window, { key: "1" });
    fireEvent.keyDown(window, { key: "ArrowRight" });
    fireEvent.keyDown(window, { key: "2" });
    // Now move further to shot 2 (gamma) — current matches NEITHER pin.
    fireEvent.keyDown(window, { key: "ArrowRight" });

    // The Current badge surfaces in the title in diff mode.
    expect(body().queryByTestId("lightbox-current-badge")).not.toBeNull();
    // diff-unpaired renders 3 panes (alpha, gamma, beta) — at least 3 imgs total.
    const imgs = body().getAllByRole("img");
    expect(imgs.length).toBeGreaterThanOrEqual(3);
  });

  it("pressing 3 clears the diff and returns to single mode", async () => {
    const { body } = setup(0);
    await body().findByText("ALPHA");
    fireEvent.keyDown(window, { key: "1" });
    fireEvent.keyDown(window, { key: "2" });
    expect(body().queryByTestId("lightbox-current-badge")).not.toBeNull();

    fireEvent.keyDown(window, { key: "3" });
    expect(body().queryByTestId("lightbox-current-badge")).toBeNull();
    const imgs = body().getAllByRole("img");
    expect(imgs.length).toBe(1);
  });
});
