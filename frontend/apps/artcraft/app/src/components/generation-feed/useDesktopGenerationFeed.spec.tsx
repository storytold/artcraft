import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useDesktopGenerationFeed } from "./useDesktopGenerationFeed";
import { MediaFilesApi } from "@storyteller/api";

const { listeners, getTasks } = vi.hoisted(() => ({
  listeners: new Map<string, (event: any) => Promise<void>>(),
  getTasks: vi.fn(async () => ({ tasks: [] })),
}));
vi.mock("@tauri-apps/api/event", () => ({
  listen: vi.fn(async (name: string, handler: any) => {
    listeners.set(name, handler);
    return () => listeners.delete(name);
  }),
}));
vi.mock("@storyteller/tauri-api", () => ({
  GetTaskQueue: getTasks,
  MarkTaskAsDismissed: vi.fn(),
  findDesktopModel: vi.fn(),
}));
vi.mock("../signaled/TopBar/taskEnqueueMeta", () => ({ getMetaForTask: vi.fn(), cleanupOldEntries: vi.fn() }));

afterEach(() => { cleanup(); listeners.clear(); vi.clearAllMocks(); });

it("never looks up a local video token to fill a missing cloud thumbnail", async () => {
  vi.useFakeTimers();
  const lookup = vi.spyOn(MediaFilesApi.prototype, "GetMediaFileByToken").mockResolvedValue({ success: false });
  const { result } = renderHook(() => useDesktopGenerationFeed({ mediaType: "video" }));
  await act(async () => { await Promise.resolve(); });
  await act(async () => { await listeners.get("video_generation_complete_event")?.({ payload: { data: { generated_video: { media_token: "local_file_video", cdn_url: "asset://localhost/video.mp4" } } } }); });
  await act(async () => { await vi.advanceTimersByTimeAsync(16000); });
  expect(result.current.newlyCompleted[0]?.id).toBe("local_file_video");
  expect(lookup).not.toHaveBeenCalled();
  cleanup();
  vi.useRealTimers();
  lookup.mockRestore();
});

it.each(["local_file_result", "m_cloud_result"])("removes newly completed %s after deletion and ignores late completions", async (token) => {
  const { result } = renderHook(() => useDesktopGenerationFeed({ mediaType: "image" }));
  await act(async () => { await Promise.resolve(); });
  const completion = { payload: { data: { generated_images: [{ media_token: token, cdn_url: "asset://localhost/result.png" }] } } };
  await act(async () => { await listeners.get("text_to_image_generation_complete_event")?.(completion); });
  expect(result.current.newlyCompleted.map((item) => item.id)).toEqual([token]);
  await act(async () => { await listeners.get("media_file_deleted_event")?.({ payload: { data: { media_file_token: token } } }); });
  expect(result.current.newlyCompleted).toEqual([]);
  await act(async () => { await listeners.get("text_to_image_generation_complete_event")?.(completion); });
  expect(result.current.newlyCompleted).toEqual([]);
});
