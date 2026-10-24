import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";

const m = vi.hoisted(() => ({ getQueue: vi.fn() }));

vi.mock("@storyteller/tauri-api", () => ({
  findDesktopModel: vi.fn(() => undefined),
  GetTaskQueue: m.getQueue,
  MarkTaskAsDismissed: vi.fn(async () => undefined),
}));
vi.mock("@tauri-apps/api/event", () => ({
  listen: vi.fn(async () => () => undefined),
}));
vi.mock("@storyteller/tauri-events", () => ({
  useTextToImageGenerationCompleteEvent: vi.fn(),
  useVideoGenerationCompleteEvent: vi.fn(),
}));
vi.mock("@storyteller/api", () => ({ MediaFilesApi: class {} }));
vi.mock("@storyteller/common", () => ({
  getMediaStillThumbnail: vi.fn(),
  getMediaThumbnail: vi.fn(),
  getThumbnailUrl: vi.fn(),
  THUMBNAIL_SIZES: { LARGE: 1 },
}));
vi.mock("@storyteller/model-list", () => ({
  ALL_MODELS_LIST: [],
  getModelDisplayName: vi.fn(() => undefined),
  getProviderDisplayName: vi.fn(() => undefined),
}));
vi.mock("../signaled/TopBar/taskEnqueueMeta", () => ({
  getMetaForTask: vi.fn(() => undefined),
  cleanupOldEntries: vi.fn(),
}));

import { useDesktopGenerationFeed } from "./useDesktopGenerationFeed";

const task = (id: string, status: string) => ({
  id,
  task_status: status,
  task_type: "image_generation",
  model_type: undefined,
  provider: undefined,
  created_at: new Date(),
  updated_at: new Date(),
});

beforeEach(() => {
  m.getQueue.mockReset();
});

afterEach(() => cleanup());

describe("useDesktopGenerationFeed", () => {
  it("shows pending tasks as in-progress jobs", async () => {
    m.getQueue.mockResolvedValue({ tasks: [task("a", "pending")] });
    const { result } = renderHook(() => useDesktopGenerationFeed({ mediaType: "image" }));
    await waitFor(() => expect(result.current.inProgress.map((j) => j.id)).toEqual(["a"]));
  });

  it("ignores tasks of the other media type", async () => {
    m.getQueue.mockResolvedValue({
      tasks: [{ ...task("v", "pending"), task_type: "video_generation" }],
    });
    const { result } = renderHook(() => useDesktopGenerationFeed({ mediaType: "image" }));
    await waitFor(() => expect(m.getQueue).toHaveBeenCalled());
    expect(result.current.inProgress).toHaveLength(0);
  });

  it("does not let a slow older response overwrite a newer one", async () => {
    // First load (mount) is slow and stale; second (refresh) is fast and fresh.
    let resolveOld: (v: unknown) => void = () => undefined;
    m.getQueue
      .mockImplementationOnce(() => new Promise((r) => (resolveOld = r)))
      .mockResolvedValueOnce({ tasks: [task("new", "pending")] });

    const { result } = renderHook(() => useDesktopGenerationFeed({ mediaType: "image" }));
    await act(async () => {
      await result.current.refresh();
    });
    expect(result.current.inProgress.map((j) => j.id)).toEqual(["new"]);

    await act(async () => {
      resolveOld({ tasks: [task("old", "pending")] });
    });
    expect(result.current.inProgress.map((j) => j.id)).toEqual(["new"]);
  });
});
