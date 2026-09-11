import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { CompletionModal } from "./CompletionModal";
import { EngineContext } from "../../contexts/EngineContext";
import { usePageSceneStore, type ProducedArtifact } from "../../PageSceneStore";
import type Editor from "../../engine/editor";

const mocks = vi.hoisted(() => ({ revoke: vi.fn() }));

vi.mock("../../contexts/EngineContext", async () => {
  const { createContext } = await import("react");
  return { EngineContext: createContext(null) };
});

beforeEach(() => {
  vi.stubGlobal("URL", { revokeObjectURL: mocks.revoke });
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  usePageSceneStore.setState({ producedArtifact: null });
  mocks.revoke.mockClear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it("uploads only on click and retains the video until its lightbox is ready", async () => {
  const artifact = setArtifact("video");
  const uploadMedia = vi.fn().mockResolvedValue("mf_video");
  let finishPreview!: () => void;
  const openMediaLightbox = vi.fn().mockReturnValue(new Promise<void>((resolve) => {
    finishPreview = resolve;
  }));
  renderModal({ uploadMedia, openMediaLightbox });
  expect(uploadMedia).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Upload & continue" }));
  await waitFor(() => expect(openMediaLightbox).toHaveBeenCalledWith("mf_video", "video"));
  expect(uploadMedia).toHaveBeenCalledWith({
    kind: "video", blob: artifact.blob, fileName: artifact.fileName,
  });
  expect(usePageSceneStore.getState().producedArtifact).toBe(artifact);
  expect(mocks.revoke).not.toHaveBeenCalled();
  expect((screen.getByRole("button", { name: "Discard" }) as HTMLButtonElement).disabled).toBe(true);
  await act(async () => finishPreview());
  expect(usePageSceneStore.getState().producedArtifact).toBeNull();
  expect(mocks.revoke).toHaveBeenCalledWith(artifact.objectUrl);
});

it("shows missing upload support instead of silently ignoring the click", async () => {
  const artifact = setArtifact("video");
  renderModal({});
  fireEvent.click(screen.getByRole("button", { name: "Upload & continue" }));
  expect((await screen.findByRole("alert")).textContent).toContain("Uploading is unavailable");
  expect(usePageSceneStore.getState().producedArtifact).toBe(artifact);
  expect(console.error).toHaveBeenCalled();
});

it("keeps a failed upload available and retries it", async () => {
  const artifact = setArtifact("video");
  const uploadMedia = vi.fn()
    .mockRejectedValueOnce(new Error("Connection lost"))
    .mockResolvedValueOnce("mf_video");
  const openMediaLightbox = vi.fn();
  renderModal({ uploadMedia, openMediaLightbox });
  fireEvent.click(screen.getByRole("button", { name: "Upload & continue" }));
  expect((await screen.findByRole("alert")).textContent).toContain("Connection lost");
  expect(usePageSceneStore.getState().producedArtifact).toBe(artifact);
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  await waitFor(() => expect(usePageSceneStore.getState().producedArtifact).toBeNull());
  expect(uploadMedia).toHaveBeenCalledTimes(2);
  expect(openMediaLightbox).toHaveBeenCalledWith("mf_video", "video");
});

it("retries preview failures without uploading the recording twice", async () => {
  setArtifact("video");
  const uploadMedia = vi.fn().mockResolvedValue("mf_video");
  const openMediaLightbox = vi.fn()
    .mockRejectedValueOnce(new Error("Preview unavailable"))
    .mockResolvedValueOnce(undefined);
  renderModal({ uploadMedia, openMediaLightbox });
  fireEvent.click(screen.getByRole("button", { name: "Upload & continue" }));
  await screen.findByRole("alert");
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  await waitFor(() => expect(usePageSceneStore.getState().producedArtifact).toBeNull());
  expect(uploadMedia).toHaveBeenCalledTimes(1);
  expect(openMediaLightbox).toHaveBeenCalledTimes(2);
});

it("still uploads captured images automatically", async () => {
  const artifact = setArtifact("image");
  const uploadMedia = vi.fn().mockResolvedValue("mf_image");
  const openMediaLightbox = vi.fn();
  renderModal({ uploadMedia, openMediaLightbox });
  await waitFor(() => expect(usePageSceneStore.getState().producedArtifact).toBeNull());
  expect(uploadMedia).toHaveBeenCalledWith({
    kind: "image", blob: artifact.blob, fileName: artifact.fileName,
  });
  expect(openMediaLightbox).toHaveBeenCalledWith("mf_image", "image");
});

function renderModal(adapter: Partial<Editor["adapter"]>) {
  return render(
    <EngineContext.Provider value={{ adapter } as Editor}>
      <CompletionModal />
    </EngineContext.Provider>,
  );
}

function setArtifact(kind: "image" | "video"): ProducedArtifact {
  const artifact: ProducedArtifact = {
    kind,
    blob: new Blob(["rendered scene"], { type: kind === "video" ? "video/mp4" : "image/png" }),
    objectUrl: "blob:scene-output",
    fileName: kind === "video" ? "recording.mp4" : "capture.png",
    mimeType: kind === "video" ? "video/mp4" : "image/png",
    aspectRatio: usePageSceneStore.getState().cameraAspectRatio,
  };
  usePageSceneStore.getState().setProducedArtifact(artifact);
  return artifact;
}
