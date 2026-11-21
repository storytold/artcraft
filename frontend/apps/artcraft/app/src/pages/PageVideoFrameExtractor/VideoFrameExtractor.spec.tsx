import React from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { setLocale } from "@storyteller/i18n";
import { VideoFrameExtractor } from "./VideoFrameExtractor";
const mocks = vi.hoisted(() => ({
  upload: vi.fn(),
  refs: vi.fn(),
  tab: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}));
vi.mock("@storyteller/api", () => ({
  MediaUploadApi: class {
    UploadImage = mocks.upload;
  },
  EIntermediateFile: { true: true, false: false },
}));
vi.mock("@storyteller/ui-gallery-modal", () => ({ GalleryModal: () => null }));
vi.mock("@storyteller/tauri-api", () => ({ downloadFileFromUrl: vi.fn() }));
vi.mock("@storyteller/ui-promptbox", () => ({
  usePromptVideoStore: { getState: () => ({ setReferenceImages: mocks.refs }) },
}));
vi.mock("~/pages/Stores/TabState", () => ({
  useTabStore: { getState: () => ({ setActiveTab: mocks.tab }) },
}));
vi.mock("react-hot-toast", () => ({
  default: { success: mocks.success, error: mocks.error },
}));

beforeEach(() => {
  vi.stubGlobal("React", React);
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue({
        blob: async () => new Blob(["frame"], { type: "image/png" }),
      }),
  );
  vi.stubGlobal(
    "URL",
    class extends URL {
      static createObjectURL = vi.fn(() => "blob:original-video");
      static revokeObjectURL = vi.fn();
    },
  );

  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    drawImage: vi.fn(),
  } as never);
  vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue(
    "data:image/png;base64,AAAA",
  );
  mocks.upload.mockResolvedValue({
    success: true,
    data: "media_frame_original",
  });
});
afterEach(async () => {
  cleanup();
  await setLocale("en");
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

it("retains extraction settings across language changes and preserves upload/routing parameters", async () => {
  const { container } = render(<VideoFrameExtractor />);
  fireEvent.change(container.querySelector('input[type="file"]')!, {
    target: {
      files: [new File(["video"], "Original 视频.mp4", { type: "video/mp4" })],
    },
  });
  const video = container.querySelector("video")!;
  let time = 0;
  Object.defineProperties(video, {
    duration: { configurable: true, value: 10 },
    readyState: { configurable: true, value: 4 },
    videoWidth: { configurable: true, value: 640 },
    videoHeight: { configurable: true, value: 360 },
    currentTime: {
      configurable: true,
      get: () => time,
      set: (value) => {
        time = value;
        queueMicrotask(() => video.dispatchEvent(new Event("seeked")));
      },
    },
  });
  fireEvent.loadedMetadata(video);
  fireEvent.change(screen.getByLabelText("Number of Frames"), {
    target: { value: "2" },
  });
  fireEvent.change(screen.getByLabelText("Distance (ms)"), {
    target: { value: "250" },
  });
  await act(() => setLocale("zh-CN"));
  expect((screen.getByLabelText("提取帧数") as HTMLInputElement).value).toBe(
    "2",
  );
  expect(
    (screen.getByLabelText("帧间隔（毫秒）") as HTMLInputElement).value,
  ).toBe("250");
  expect(video.getAttribute("src")).toBe("blob:original-video");
  await act(async () =>
    fireEvent.click(screen.getByRole("button", { name: "提取视频帧" })),
  );
  expect(screen.getByText("2 帧")).toBeTruthy();
  expect(screen.getByRole("img", { name: "第 2 帧" })).toBeTruthy();
  await act(async () =>
    fireEvent.click(
      screen.getAllByRole("button", { name: "保存", exact: true })[0],
    ),
  );
  expect(mocks.upload).toHaveBeenCalledWith(
    expect.objectContaining({
      fileName: "frame-00:00.000.png",
      maybe_title: "video-frame-0",
      is_intermediate_system_file: false,
    }),
  );
  expect(mocks.success).toHaveBeenCalledWith("视频帧已保存到素材库！");
  await act(async () =>
    fireEvent.click(
      screen.getAllByRole("button", { name: "生成视频", exact: true })[1],
    ),
  );
  expect(mocks.upload).toHaveBeenLastCalledWith(
    expect.objectContaining({
      fileName: "frame-00:00.250.png",
      maybe_title: "video-frame-0.25",
      is_intermediate_system_file: true,
    }),
  );
  expect(mocks.refs).toHaveBeenCalledWith([
    expect.objectContaining({ mediaToken: "media_frame_original" }),
  ]);
  expect(mocks.tab).toHaveBeenCalledWith("VIDEO");
  await act(() => setLocale("en"));
  expect(screen.getByText("2 Frames")).toBeTruthy();
  expect(
    screen.getByRole("button", { name: "Saved", exact: true }),
  ).toBeTruthy();
});
