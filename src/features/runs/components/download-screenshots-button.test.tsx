import { cleanup, fireEvent, render, waitFor } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { DownloadScreenshotsButton } from "@/features/runs/components/download-screenshots-button";
import { buildScreenshotsZip, saveScreenshotsZip } from "@/features/runs/download-screenshots";
import { buildFakeManifest, FAKE_RUN_DOCS } from "@/shared/api/fake-data";
import type { ImagesArchive } from "@/shared/api/storage";
import { setLocale } from "@/shared/lib/i18n";

vi.mock("@/features/runs/download-screenshots", () => ({
  buildScreenshotsZip: vi.fn(),
  saveScreenshotsZip: vi.fn(),
}));

const manifest = buildFakeManifest(FAKE_RUN_DOCS[0].runId);
if (!manifest) throw new Error("Expected fixture manifest");
const loadedManifest = manifest;
const archive: ImagesArchive = { urls: new Map(), thumbs: () => new Map() };

beforeEach(() => {
  vi.resetAllMocks();
  setLocale("en");
});
afterEach(cleanup);

it("updates the matching count and disables downloads for an empty selection", () => {
  const [shots, setShots] = createSignal(loadedManifest.shots.slice(0, 2));
  const ensureArchive = vi.fn().mockResolvedValue(archive);
  const view = render(() => (
    <DownloadScreenshotsButton
      manifest={loadedManifest}
      shots={shots()}
      ensureArchive={ensureArchive}
    />
  ));
  expect(view.getByRole("button", { name: "Download ZIP (2)" })).toBeEnabled();
  setShots([]);
  expect(view.getByRole("button", { name: "Download ZIP (0)" })).toBeDisabled();
  expect(ensureArchive).not.toHaveBeenCalled();
});

it("waits for images and keeps the selection from the moment the download was clicked", async () => {
  const selected = loadedManifest.shots.slice(0, 2);
  const [shots, setShots] = createSignal(selected);
  let resolveArchive!: (value: ImagesArchive) => void;
  const ensureArchive = vi.fn(
    () =>
      new Promise<ImagesArchive>((resolve) => {
        resolveArchive = resolve;
      }),
  );
  const blob = new Blob();
  vi.mocked(buildScreenshotsZip).mockResolvedValue(blob);
  const view = render(() => (
    <DownloadScreenshotsButton
      manifest={loadedManifest}
      shots={shots()}
      ensureArchive={ensureArchive}
    />
  ));
  fireEvent.click(view.getByRole("button"));
  expect(view.getByRole("button", { name: "Preparing ZIP…" })).toBeDisabled();
  expect(buildScreenshotsZip).not.toHaveBeenCalled();
  setShots([]);
  resolveArchive(archive);
  await waitFor(() => expect(saveScreenshotsZip).toHaveBeenCalledWith(blob, loadedManifest.runId));
  expect(buildScreenshotsZip).toHaveBeenCalledWith(loadedManifest, selected, archive);
  expect(ensureArchive).toHaveBeenCalledOnce();
});

it("shows errors and allows retrying", async () => {
  const ensureArchive = vi.fn().mockResolvedValueOnce(null).mockResolvedValue(archive);
  vi.mocked(buildScreenshotsZip).mockResolvedValue(new Blob());
  const view = render(() => (
    <DownloadScreenshotsButton
      manifest={loadedManifest}
      shots={loadedManifest.shots}
      ensureArchive={ensureArchive}
    />
  ));
  fireEvent.click(view.getByRole("button"));
  expect(await view.findByRole("alert")).toHaveTextContent("Could not load the image archive");
  expect(view.getByRole("button")).toBeEnabled();
  fireEvent.click(view.getByRole("button"));
  await waitFor(() => expect(saveScreenshotsZip).toHaveBeenCalledOnce());
  expect(view.queryByRole("alert")).toBeNull();
});

it("does not start a download after the run changes during ZIP creation", async () => {
  const [current, setCurrent] = createSignal(loadedManifest);
  let resolveZip!: (blob: Blob) => void;
  vi.mocked(buildScreenshotsZip).mockImplementation(
    () =>
      new Promise((resolve) => {
        resolveZip = resolve;
      }),
  );
  const view = render(() => (
    <DownloadScreenshotsButton
      manifest={current()}
      shots={current().shots}
      ensureArchive={async () => archive}
    />
  ));
  fireEvent.click(view.getByRole("button"));
  await waitFor(() => expect(buildScreenshotsZip).toHaveBeenCalledOnce());
  setCurrent({ ...loadedManifest, runId: "other-run" });
  resolveZip(new Blob());
  await waitFor(() => expect(view.getByRole("button")).toBeEnabled());
  expect(saveScreenshotsZip).not.toHaveBeenCalled();
});

it("does not start a download after leaving the page while images load", async () => {
  let resolveArchive!: (value: ImagesArchive) => void;
  const view = render(() => (
    <DownloadScreenshotsButton
      manifest={loadedManifest}
      shots={loadedManifest.shots}
      ensureArchive={() =>
        new Promise((resolve) => {
          resolveArchive = resolve;
        })
      }
    />
  ));
  fireEvent.click(view.getByRole("button"));
  view.unmount();
  resolveArchive(archive);
  await Promise.resolve();
  expect(buildScreenshotsZip).not.toHaveBeenCalled();
});
