import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

const m = vi.hoisted(() => ({
  list: vi.fn(),
  del: vi.fn(),
  getFile: vi.fn(),
  getBatch: vi.fn(),
}));

vi.mock("@storyteller/api", () => ({
  JobStatus: {
    PENDING: "pending",
    STARTED: "started",
    COMPLETE_SUCCESS: "complete_success",
    ATTEMPT_FAILED: "attempt_failed",
    COMPLETE_FAILURE: "complete_failure",
    DEAD: "dead",
    CANCELLED_BY_USER: "cancelled_by_user",
    CANCELLED_BY_SYSTEM: "cancelled_by_system",
  },
  JobsApi: class {
    ListRecentJobs = m.list;
    DeleteJobByToken = m.del;
  },
  MediaFilesApi: class {
    GetMediaFileByToken = m.getFile;
    GetMediaFilesByBatchToken = m.getBatch;
  },
}));

vi.mock("@storyteller/common", () => ({
  getMediaThumbnail: () => "thumb",
  getMediaStillThumbnail: () => "still",
  THUMBNAIL_SIZES: { LARGE: 512 },
}));

vi.mock("@storyteller/model-list", () => ({
  getModelDisplayName: (id: string) => `model:${id}`,
  getProviderDisplayName: (id: string) => `prov:${id}`,
  ALL_MODELS_LIST: [],
}));

// A stable empty map: a new Map each render would re-trigger memos forever.
const EMPTY_PROMPTS = new Map();
vi.mock("./prompts-cache", () => ({
  usePrompts: () => EMPTY_PROMPTS,
  getCachedPrompt: () => undefined,
}));

import { useGenerationJobs } from "./useGenerationJobs";

function deferred<T>() {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}

// Builds a Job with only the fields the hook reads.
const job = (
  token: string,
  category: string,
  status: string,
  extra: Record<string, unknown> = {},
) => ({
  job_token: token,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  request: { inference_category: category, maybe_prompt_token: null },
  status: { status },
  maybe_result: null,
  ...extra,
});

const done = (token: string, category: string, entity: string) =>
  job(token, category, "complete_success", {
    maybe_result: { entity_token: entity, media_links: { cdn_url: "u" } },
  });

const ok = (data: unknown[]) => ({ success: true, data });

beforeEach(() => {
  m.list.mockReset();
  m.del.mockReset();
  m.getFile.mockReset();
  m.getBatch.mockReset();
  m.getFile.mockResolvedValue({ data: {} }); // no batch token: item stays single
});

describe("useGenerationJobs", () => {
  it("keeps only jobs of the requested media type and sorts them by status", async () => {
    m.list.mockResolvedValue(
      ok([
        job("img-run", "image_generation", "started"),
        job("vid-run", "video_generation", "started"),
        job("img-fail", "image_generation", "dead"),
      ]),
    );
    const { result } = renderHook(() => useGenerationJobs({ mediaType: "image" }));
    await waitFor(() => expect(result.current.inProgress).toHaveLength(1));
    expect(result.current.inProgress[0].id).toBe("img-run");
    expect(result.current.failed.map((f) => f.id)).toEqual(["img-fail"]);
  });

  it("does not poll when disabled", async () => {
    renderHook(() => useGenerationJobs({ mediaType: "image", enabled: false }));
    await Promise.resolve();
    expect(m.list).not.toHaveBeenCalled();
  });

  it("does not report already-finished jobs as new on the first poll, only later ones", async () => {
    m.list.mockResolvedValue(ok([done("j1", "image_generation", "e1")]));
    const { result } = renderHook(() => useGenerationJobs({ mediaType: "image" }));
    await waitFor(() => expect(m.list).toHaveBeenCalledTimes(1));
    await act(async () => {});
    expect(result.current.newlyCompleted).toEqual([]);

    m.list.mockResolvedValue(
      ok([done("j1", "image_generation", "e1"), done("j2", "image_generation", "e2")]),
    );
    await act(async () => {
      await result.current.refresh();
    });
    expect(result.current.newlyCompleted.map((i) => i.id)).toEqual(["e2"]);
  });

  it("does not flood the feed with old completions after the media type changes", async () => {
    m.list.mockResolvedValue(
      ok([done("i1", "image_generation", "e-img"), done("v1", "video_generation", "e-vid")]),
    );
    const { result, rerender } = renderHook(
      ({ t }: { t: "image" | "video" }) => useGenerationJobs({ mediaType: t }),
      { initialProps: { t: "image" as "image" | "video" } },
    );
    await waitFor(() => expect(m.list).toHaveBeenCalledTimes(1));

    rerender({ t: "video" });
    await waitFor(() => expect(m.list).toHaveBeenCalledTimes(2));
    await act(async () => {});
    // The video job was already finished before we switched: not "new".
    expect(result.current.newlyCompleted).toEqual([]);
  });

  it("drops a poll for the old media type that resolves after a switch", async () => {
    const slow = deferred<ReturnType<typeof ok>>();
    m.list
      .mockReturnValueOnce(slow.promise)
      .mockResolvedValueOnce(ok([job("v-run", "video_generation", "started")]));

    const { result, rerender } = renderHook(
      ({ t }: { t: "image" | "video" }) => useGenerationJobs({ mediaType: t }),
      { initialProps: { t: "image" as "image" | "video" } },
    );
    rerender({ t: "video" });
    await waitFor(() => expect(result.current.inProgress.map((j) => j.id)).toEqual(["v-run"]));

    await act(async () => {
      slow.resolve(ok([job("i-late", "image_generation", "started")]));
    });
    expect(result.current.inProgress.map((j) => j.id)).toEqual(["v-run"]);
  });

  it("dismissFailed deletes the job and removes it from the list", async () => {
    m.list.mockResolvedValue(ok([job("f1", "image_generation", "dead")]));
    m.del.mockResolvedValue({});
    const { result } = renderHook(() => useGenerationJobs({ mediaType: "image" }));
    await waitFor(() => expect(result.current.failed).toHaveLength(1));
    await act(async () => {
      await result.current.dismissFailed("f1");
    });
    expect(m.del).toHaveBeenCalledWith("f1");
    expect(result.current.failed).toHaveLength(0);
  });
});
