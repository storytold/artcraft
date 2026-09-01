import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const modelPages = vi.hoisted(() => ({
  ImageToVideo: "image-to-video",
  TextToImage: "text-to-image",
}));

const estimateVideoCost = vi.hoisted(() => vi.fn());

const videoStore = vi.hoisted(() => ({
  duration: 15 as number | null,
  aspectRatio: "16:9",
  resolution: "720p",
  inputMode: "keyframe",
  referenceImages: [] as unknown[],
  endFrameImage: undefined as unknown,
  referenceVideos: [] as unknown[],
  referenceAudios: [] as unknown[],
  generateWithSound: false,
}));

vi.mock("@storyteller/ui-model-selector", () => ({
  ModelPage: modelPages,
}));

vi.mock("@storyteller/api-enums", () => ({
  GenerationProvider: { Artcraft: "artcraft" },
}));

vi.mock("@storyteller/tauri-api", () => ({
  EstimateVideoCost: estimateVideoCost,
  isEstimateVideoCostSuccess: (result: { status: string }) =>
    result.status === "success",
}));

vi.mock("@storyteller/ui-promptbox", () => ({
  usePromptVideoStore: (selector: (state: typeof videoStore) => unknown) =>
    selector(videoStore),
}));

vi.mock("./convert/index.js", () => ({
  videoModelToCommonVideoModel: (model: string) => model || null,
  videoAspectRatioToCommonAspectRatio: () => null,
  stringToCommonVideoResolution: () => null,
  videoStoreToGenerationMode: (inputMode: string) => inputMode,
}));

import { ModelPage } from "@storyteller/ui-model-selector";
import type { Model } from "@storyteller/model-list";
import { useCostBreakdownModalStore } from "./cost-breakdown-modal-store";
import { useVideoCostEstimate } from "./useVideoCostEstimate";

const videoModel = {
  kind: "video_model",
  id: "duration-test-video",
  tauriId: "duration-test-video",
  sizeOptions: [],
  supportsReferenceMode: true,
  minDuration: 4,
  maxDuration: 15,
  maxDurationWithImageReferences: 10,
  defaultDuration: 5,
} as unknown as Model;

const successfulEstimate = {
  status: "success",
  payload: { cost_in_credits: 7 },
};

const renderEstimate = () =>
  renderHook(() =>
    useVideoCostEstimate(ModelPage.ImageToVideo, videoModel, "artcraft"),
  );

const runDebounce = async () => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(300);
  });
};

beforeEach(() => {
  vi.useFakeTimers();
  estimateVideoCost.mockReset();
  estimateVideoCost.mockResolvedValue(successfulEstimate);
  Object.assign(videoStore, {
    duration: 15,
    inputMode: "keyframe",
    referenceImages: [],
    endFrameImage: undefined,
    referenceVideos: [],
    referenceAudios: [],
  });
  useCostBreakdownModalStore.setState({ estimatedCreditsByPage: {} });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("video duration estimate consumer", () => {
  it("clears an old quote immediately and debounces only the remote call", async () => {
    useCostBreakdownModalStore
      .getState()
      .setEstimatedCreditsForPage(ModelPage.ImageToVideo, 99);

    const { result } = renderEstimate();

    expect(result.current.isLoading).toBe(true);
    expect(
      useCostBreakdownModalStore.getState().estimatedCreditsByPage[
        ModelPage.ImageToVideo
      ],
    ).toBeNull();
    expect(estimateVideoCost).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(299);
    });
    expect(estimateVideoCost).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(estimateVideoCost).toHaveBeenCalledOnce();
    expect(result.current.isLoading).toBe(false);
  });

  it.each([
    ["a starting-frame image", "keyframe", [{}], undefined, [], [], 10],
    ["a reference image", "reference", [{}], undefined, [], [], 10],
    ["an ending-frame image", "keyframe", [], {}, [], [], 10],
    [
      "video/audio references with a stale hidden end frame",
      "reference",
      [],
      {},
      [{}],
      [{}],
      15,
    ],
  ])(
    "sends the projected duration for %s",
    async (
      _label,
      inputMode,
      referenceImages,
      endFrameImage,
      referenceVideos,
      referenceAudios,
      expectedDuration,
    ) => {
      Object.assign(videoStore, {
        inputMode,
        referenceImages,
        endFrameImage,
        referenceVideos,
        referenceAudios,
      });

      renderEstimate();
      await runDebounce();

      expect(estimateVideoCost).toHaveBeenCalledOnce();
      expect(estimateVideoCost).toHaveBeenCalledWith(
        expect.objectContaining({ duration_seconds: expectedDuration }),
      );
    },
  );

  it("cancels a pending old-duration estimate when the store changes", async () => {
    const { rerender } = renderEstimate();

    videoStore.duration = 12;
    rerender();
    await runDebounce();

    expect(estimateVideoCost).toHaveBeenCalledOnce();
    expect(estimateVideoCost).toHaveBeenCalledWith(
      expect.objectContaining({ duration_seconds: 12 }),
    );
  });

  it("does not estimate an impossible image-capped duration contract", async () => {
    Object.assign(videoStore, {
      referenceImages: [{}],
    });
    const impossibleModel = {
      ...videoModel,
      minDuration: 4,
      maxDuration: 15,
      maxDurationWithImageReferences: 3,
    } as unknown as Model;

    const { result } = renderHook(() =>
      useVideoCostEstimate(ModelPage.ImageToVideo, impossibleModel, "artcraft"),
    );

    await runDebounce();
    expect(estimateVideoCost).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });
});
