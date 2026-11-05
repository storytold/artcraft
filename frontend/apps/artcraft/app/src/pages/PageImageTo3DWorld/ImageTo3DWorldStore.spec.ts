// Spec for the 3D world store: how a generation job leaves the "Generating…" state.
//
// Same shape as the 3D object store (see ../PageImageTo3DObject/ImageTo3DStore.spec.ts): the world variant of
// the 3D tab adds a spinner row when Generate is pressed, and a job that fails after it was accepted is
// reported by a "generation-failed-event" with the action ("generate_gaussian") but no job id. The store used
// to ignore it, so the spinner row stayed until "Clear Session". It must take the failed job's row away, and
// must not guess when it cannot tell which job failed.

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

// The cover upload talks to the network; not under test here.
vi.mock("@storyteller/api", () => ({
  MediaFilesApi: class {},
  MediaUploadApi: class {},
}));

import { useImageTo3DWorldStore } from "./ImageTo3DWorldStore";

// Delivers an event to the store's handler, if the store listens for it at all.
function emit(name: string, data: unknown) {
  bus.handlers[name]?.({ payload: { status: "success", data } });
}

// What the backend sends when a job fails (see handle_storyteller_failed_job.rs).
function jobFailed(action: string, model: string | undefined = "marble_0p1_mini") {
  emit("generation-failed-event", {
    action,
    service: "artcraft",
    model,
    reason: "The server could not build a world",
  });
}

// What the backend sends when a job finishes and produced a world.
function jobCompleted(subscriberId: string, mediaToken: string) {
  emit("gaussian_generation_complete_event", {
    generated_gaussian: {
      cdn_url: `https://cdn.test/${mediaToken}.spz`,
      media_token: mediaToken,
    },
    maybe_frontend_subscriber_id: subscriberId,
  });
}

// Starts a job the way the 3D tab does (image mode, with a known job id).
const start = (id: string) =>
  useImageTo3DWorldStore.getState().startGeneration("image", `room ${id}`, undefined, id);

const rowIds = () => useImageTo3DWorldStore.getState().results.map((r) => r.subscriberId);

beforeEach(() => {
  useImageTo3DWorldStore.getState().reset();
});

describe("ImageTo3DWorldStore a failed job", () => {
  it("takes the spinner row away", () => {
    start("job-1");
    expect(rowIds()).toEqual(["job-1"]);

    jobFailed("generate_gaussian");

    expect(rowIds()).toEqual([]);
  });

  it("leaves finished worlds alone and removes only the pending row", () => {
    start("job-done");
    jobCompleted("job-done", "media-done");
    start("job-failed");

    jobFailed("generate_gaussian");

    const rows = useImageTo3DWorldStore.getState().results;
    expect(rows.map((r) => r.subscriberId)).toEqual(["job-done"]);
    expect(rows[0].status).toBe("completed");
  });

  it("does not guess when two jobs are pending", () => {
    start("job-a");
    start("job-b");

    jobFailed("generate_gaussian");

    expect(rowIds().sort()).toEqual(["job-a", "job-b"]);
  });

  it("ignores a failure of a different kind of job", () => {
    start("job-1");

    jobFailed("generate_image");
    jobFailed("image_to_3d");

    expect(rowIds()).toEqual(["job-1"]);
  });

  it("does nothing when no job is pending", () => {
    expect(() => jobFailed("generate_gaussian")).not.toThrow();
    expect(rowIds()).toEqual([]);
  });
});

describe("ImageTo3DWorldStore a finished job", () => {
  it("turns the pending row into a world (control)", () => {
    start("job-1");

    jobCompleted("job-1", "media-1");

    const rows = useImageTo3DWorldStore.getState().results;
    expect(rows.map((r) => r.subscriberId)).toEqual(["job-1"]);
    expect(rows[0].status).toBe("completed");
    expect(rows[0].mediaToken).toBe("media-1");
  });
});
