// Spec for the Remove Background store: how the "Removing Background..." state ends when a job fails.
//
// The page sets `isProcessing` when an image is sent, which puts a spinner overlay over the preview and
// disables the Download and Compare buttons. It was only cleared by the "bg removed" result event or when the
// enqueue call itself threw. A job that is accepted and then fails on the server is reported by a
// "generation-failed-event" with the action ("remove_background") but no job id; the store ignored it, so the
// overlay kept spinning. The failure must end the processing state, must keep the job id (so a result that
// still arrives is accepted), and must not touch anything when the page is not processing.

import { beforeEach, describe, expect, it, vi } from "vitest";

type Handler = (event: { payload: unknown }) => void;

// Handlers the store registered with `listen`, by event name.
const bus = vi.hoisted(() => ({ handlers: {} as Record<string, Handler> }));

vi.mock("@tauri-apps/api/event", () => ({
  listen: vi.fn(async (name: string, handler: Handler) => {
    bus.handlers[name] = handler;
    return () => undefined;
  }),
}));

import { useRemoveBackgroundStore } from "./RemoveBackgroundStore";

// Delivers an event to the store's handler, if the store listens for it at all.
function emit(name: string, data: unknown) {
  bus.handlers[name]?.({ payload: { status: "success", data } });
}

// What the backend sends when a job fails (see handle_storyteller_failed_job.rs and handle_fal_failure.rs;
// the fal path sends `model: undefined`/null).
function jobFailed(action: string, model: string | undefined = "bria_rmbg") {
  emit("generation-failed-event", {
    action,
    service: "artcraft",
    model,
    reason: "The server could not remove the background",
  });
}

// Puts the store in the state the page leaves it in right after an image was sent.
function startProcessing(jobId: string) {
  const s = useRemoveBackgroundStore.getState();
  s.setCurrentOriginalUrl("blob:original");
  s.setIsProcessing(true);
  s.setPendingJobId(jobId);
}

beforeEach(() => {
  useRemoveBackgroundStore.getState().clearAll();
});

describe("RemoveBackgroundStore a failed job", () => {
  it("ends the processing state", () => {
    startProcessing("job-1");

    jobFailed("remove_background");

    expect(useRemoveBackgroundStore.getState().isProcessing).toBe(false);
  });

  it("ends the processing state when the failure names no model", () => {
    startProcessing("job-1");

    jobFailed("remove_background", undefined);

    expect(useRemoveBackgroundStore.getState().isProcessing).toBe(false);
  });

  it("keeps the job id, so a result that still arrives for it is accepted", () => {
    startProcessing("job-1");

    jobFailed("remove_background");

    expect(useRemoveBackgroundStore.getState().pendingJobId).toBe("job-1");
  });

  it("keeps the images that were already finished (control)", () => {
    const s = useRemoveBackgroundStore.getState();
    s.addImage({ id: "img-1", originalUrl: "o", processedUrl: "p", timestamp: 1 });
    startProcessing("job-2");

    jobFailed("remove_background");

    const after = useRemoveBackgroundStore.getState();
    expect(after.images.map((i) => i.id)).toEqual(["img-1"]);
    expect(after.activeImageId).toBe("img-1");
  });

  it("ignores a failure of a different kind of job (control)", () => {
    startProcessing("job-1");

    jobFailed("generate_image");
    jobFailed("image_to_3d");

    expect(useRemoveBackgroundStore.getState().isProcessing).toBe(true);
  });

  it("does nothing when the page is not processing (control)", () => {
    const before = useRemoveBackgroundStore.getState();

    expect(() => jobFailed("remove_background")).not.toThrow();

    expect(useRemoveBackgroundStore.getState()).toBe(before);
  });
});
