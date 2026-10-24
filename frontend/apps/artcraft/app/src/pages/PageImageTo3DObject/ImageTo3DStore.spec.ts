// Spec for the 3D object store: how a generation job leaves the "Generating…" state.
//
// What is being protected: pressing Generate on the 3D tab adds a row to the session list with a spinner and
// the text "Generating…". The row is turned into a finished model when the job's result arrives. A job can
// also FAIL after it was accepted (the server errored, the input was rejected). The backend then sends a
// "generation-failed-event" with the action ("image_to_3d") and the model, but no job id, and the store used
// to ignore it, so the spinner row stayed for good (only "Clear Session" removed it). The store must take the
// failed job's row away, and must not guess when it cannot tell which job failed.
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

// The finished-model path takes a thumbnail with three.js, which jsdom cannot do; it is not under test here.
vi.mock("./captureModelThumbnail", () => ({
  captureModelThumbnail: vi.fn(async () => null),
}));

// The cover upload talks to the network; not under test here either.
vi.mock("@storyteller/api", () => ({
  MediaFilesApi: class {},
  MediaUploadApi: class {},
}));

import { useImageTo3DStore } from "./ImageTo3DStore";

// Delivers an event to the store's handler, if the store listens for it at all.
function emit(name: string, data: unknown) {
  bus.handlers[name]?.({ payload: { status: "success", data } });
}

// What the backend sends when a job fails (see handle_storyteller_failed_job.rs).
function jobFailed(action: string, model: string | undefined = "hunyuan_3d_3") {
  emit("generation-failed-event", {
    action,
    service: "artcraft",
    model,
    reason: "The server could not build a model",
  });
}

// What the backend sends when a job finishes and produced a model.
function jobCompleted(subscriberId: string, mediaToken: string) {
  emit("object_generation_complete_event", {
    generated_object: {
      cdn_url: `https://cdn.test/${mediaToken}.glb`,
      media_token: mediaToken,
    },
    maybe_frontend_subscriber_id: subscriberId,
  });
}

// Starts a job the way the 3D tab does (image mode, with a known job id).
const start = (id: string) =>
  useImageTo3DStore.getState().startGeneration("image", `cat ${id}`, undefined, false, id);

const rowIds = () => useImageTo3DStore.getState().results.map((r) => r.subscriberId);

beforeEach(() => {
  useImageTo3DStore.getState().reset();
});

describe("ImageTo3DStore a failed job", () => {
  it("takes the spinner row away", () => {
    start("job-1");
    expect(rowIds()).toEqual(["job-1"]);

    jobFailed("image_to_3d");

    expect(rowIds()).toEqual([]);
  });

  it("does not depend on how the model name is spelled", () => {
    // The model list calls Hunyuan 2.0 "hunyuan_3d_2_0" but the backend reports "hunyuan_3d_2.0"; the action
    // is what identifies the 3D tab, so a differently spelled model must still clear the row.
    start("job-1");

    jobFailed("image_to_3d", "hunyuan_3d_2.0");

    expect(rowIds()).toEqual([]);
  });

  it("leaves finished models alone and removes only the pending row", () => {
    start("job-done");
    jobCompleted("job-done", "media-done");
    start("job-failed");

    jobFailed("image_to_3d");

    const rows = useImageTo3DStore.getState().results;
    expect(rows.map((r) => r.subscriberId)).toEqual(["job-done"]);
    expect(rows[0].status).toBe("completed");
  });

  it("does not guess when two jobs are pending", () => {
    // The event does not say which of the two failed; removing the wrong row would hide a job that is still
    // running and whose result would then show up as an unexplained extra model.
    start("job-a");
    start("job-b");

    jobFailed("image_to_3d");

    expect(rowIds().sort()).toEqual(["job-a", "job-b"]);
  });

  it("ignores a failure of a different kind of job", () => {
    start("job-1");

    jobFailed("generate_image");
    jobFailed("generate_gaussian");

    expect(rowIds()).toEqual(["job-1"]);
  });

  it("does nothing when no job is pending", () => {
    expect(() => jobFailed("image_to_3d")).not.toThrow();
    expect(rowIds()).toEqual([]);
  });
});

describe("ImageTo3DStore a finished job", () => {
  it("turns the pending row into a model (control)", () => {
    start("job-1");

    jobCompleted("job-1", "media-1");

    const rows = useImageTo3DStore.getState().results;
    expect(rows.map((r) => r.subscriberId)).toEqual(["job-1"]);
    expect(rows[0].status).toBe("completed");
    expect(rows[0].mediaToken).toBe("media-1");
  });
});
