// Spec for the Angles page's store: how a generation job leaves the "pending" list.
//
// What is being protected: pressing Generate adds a loading placeholder to the history column and turns
// `isProcessing` on (which also disables the Download button). The placeholder is removed when the job's
// result arrives. A job can also FAIL (the prompt was flagged, the server errored). The backend then
// sends a "generation-failed-event" that carries the action and the model but no job id, and the page
// used to ignore it, so the placeholder stayed up and Download stayed disabled until the user cleared the
// history. The store must take its own failed job off the pending list, and only its own.
// The Tauri event bus is replaced by a small fake that remembers each handler the store registers, so the
// tests can deliver events the way the backend does (wrapped as { status, data }).

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

import { useAnglesStore } from "./AnglesStore";

// Delivers an event to the store's handler, if the store listens for it at all.
function emit(name: string, data: unknown) {
  bus.handlers[name]?.({ payload: { status: "success", data } });
}

// What the backend sends when a job fails (see handle_storyteller_failed_job.rs).
function jobFailed(model: string | undefined, action = "generate_image") {
  emit("generation-failed-event", {
    action,
    service: "artcraft",
    model,
    reason: "Your prompt was flagged",
  });
}

// What the backend sends when a job finishes and produced one picture.
function jobCompleted(subscriberId: string, mediaToken: string) {
  emit("text_to_image_generation_complete_event", {
    generated_images: [
      { media_token: mediaToken, cdn_url: `https://cdn.test/${mediaToken}.png` },
    ],
    maybe_frontend_subscriber_id: subscriberId,
  });
}

// `startGeneration` takes the model id as a second argument; the call goes through a cast so this file
// type-checks against the store either way.
const start = (id: string, model: string) =>
  (
    useAnglesStore.getState().startGeneration as (
      subscriberId: string,
      modelId?: string,
    ) => void
  )(id, model);

beforeEach(() => {
  useAnglesStore.getState().clearAll();
});

describe("AnglesStore a failed job", () => {
  it("takes the loading placeholder away and turns processing off", () => {
    start("job-1", "flux_2_lora_angles");
    expect(useAnglesStore.getState().isProcessing).toBe(true);

    jobFailed("flux_2_lora_angles");

    const state = useAnglesStore.getState();
    expect(state.pendingSubscriberIds).toEqual([]);
    expect(state.isProcessing).toBe(false);
  });

  it("removes only the job that used the failed model when two models are pending", () => {
    start("job-flux", "flux_2_lora_angles");
    start("job-qwen", "qwen_edit_2511_angles");

    jobFailed("qwen_edit_2511_angles");

    const state = useAnglesStore.getState();
    expect(state.pendingSubscriberIds).toEqual(["job-flux"]);
    // The other job is still running, so the page is still processing.
    expect(state.isProcessing).toBe(true);
  });

  it("still accepts the result of the job that did not fail", () => {
    start("job-flux", "flux_2_lora_angles");
    start("job-qwen", "qwen_edit_2511_angles");
    jobFailed("qwen_edit_2511_angles");

    jobCompleted("job-flux", "media-flux");

    const state = useAnglesStore.getState();
    expect(state.generatedAngles.map((a) => a.id)).toEqual(["media-flux"]);
    expect(state.pendingSubscriberIds).toEqual([]);
    expect(state.isProcessing).toBe(false);
  });

  it("does not guess when two pending jobs used the failed model", () => {
    // The event does not say which of the two failed, so both placeholders stay: removing the wrong one
    // would also throw away the result of the job that is still running.
    start("job-a", "flux_2_lora_angles");
    start("job-b", "flux_2_lora_angles");

    jobFailed("flux_2_lora_angles");

    expect(useAnglesStore.getState().pendingSubscriberIds).toEqual(["job-a", "job-b"]);
  });

  it("ignores a failure for a model this page did not use", () => {
    start("job-1", "flux_2_lora_angles");

    jobFailed("nano_banana");

    expect(useAnglesStore.getState().pendingSubscriberIds).toEqual(["job-1"]);
  });

  it("ignores a failure that is not an image generation", () => {
    start("job-1", "flux_2_lora_angles");

    jobFailed("flux_2_lora_angles", "generate_video");

    expect(useAnglesStore.getState().pendingSubscriberIds).toEqual(["job-1"]);
  });

  it("ignores a failure that names no model", () => {
    start("job-1", "flux_2_lora_angles");

    jobFailed(undefined);

    expect(useAnglesStore.getState().pendingSubscriberIds).toEqual(["job-1"]);
  });

  it("does nothing when no job is pending", () => {
    expect(() => jobFailed("flux_2_lora_angles")).not.toThrow();
    expect(useAnglesStore.getState().pendingSubscriberIds).toEqual([]);
    expect(useAnglesStore.getState().isProcessing).toBe(false);
  });
});

describe("AnglesStore a finished job", () => {
  it("adds the picture and clears the placeholder (control)", () => {
    start("job-1", "flux_2_lora_angles");

    jobCompleted("job-1", "media-1");

    const state = useAnglesStore.getState();
    expect(state.generatedAngles.map((a) => a.id)).toEqual(["media-1"]);
    expect(state.activeAngleId).toBe("media-1");
    expect(state.pendingSubscriberIds).toEqual([]);
    expect(state.isProcessing).toBe(false);
  });

  it("ignores a result for a job this page did not start (control)", () => {
    start("job-1", "flux_2_lora_angles");

    jobCompleted("someone-elses-job", "media-x");

    const state = useAnglesStore.getState();
    expect(state.generatedAngles).toEqual([]);
    expect(state.pendingSubscriberIds).toEqual(["job-1"]);
  });
});
