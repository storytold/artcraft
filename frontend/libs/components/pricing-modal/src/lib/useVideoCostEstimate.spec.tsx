import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { ModelPage } from "@storyteller/ui-model-selector";
import { VideoModel } from "@storyteller/model-list";
import { useVideoCostEstimate } from "./useVideoCostEstimate";

const mocks = vi.hoisted(() => ({
  estimate: vi.fn(),
  setCredits: vi.fn(),
  state: {
    duration: 30,
    aspectRatio: "16:9",
    resolution: "4K",
    inputMode: "reference",
    referenceImages: [{ mediaToken: "mf_image" }],
    endFrameImage: undefined,
    referenceVideos: [{ mediaToken: "mf_video", duration: 7.25 }],
    referenceAudios: [{ mediaToken: "mf_audio", duration: 3.5 }],
    bitrate: "high",
    outputFormat: "mov",
    generationCount: 1,
    generateWithSound: true,
  },
}));

vi.mock("@storyteller/ui-promptbox", () => ({
  usePromptVideoStore: (select: any) => select(mocks.state),
}));
vi.mock("@storyteller/ui-model-selector", () => ({
  ModelPage: { ImageToVideo: "image_to_video" },
}));
vi.mock("@storyteller/tauri-api", () => ({
  EstimateVideoCost: mocks.estimate,
  isEstimateVideoCostSuccess: (result: any) => result.status === "success",
}));
vi.mock("./cost-breakdown-modal-store", () => ({
  useCostBreakdownModalStore: (select: any) =>
    select({ setEstimatedCreditsForPage: mocks.setCredits }),
}));

beforeEach(() => {
  mocks.state.generationCount = 1;
  mocks.estimate.mockReset();
  mocks.setCredits.mockReset();
  mocks.estimate.mockResolvedValue({
    status: "success",
    payload: { cost_in_credits: 42 },
  });
});

it("quotes a future model with the chosen bitrate and reference durations in milliseconds", async () => {
  renderHook(() =>
    useVideoCostEstimate(ModelPage.ImageToVideo, model, "artcraft"),
  );
  await waitFor(() =>
    expect(mocks.setCredits).toHaveBeenLastCalledWith(
      ModelPage.ImageToVideo,
      42,
    ),
  );
  expect(mocks.estimate).toHaveBeenCalledWith(
    expect.objectContaining({
      model: "future_video",
      resolution: "four_k",
      bitrate: "high",
      output_format: "mov",
      duration_seconds: 30,
      reference_video_media_tokens: ["mf_video"],
      reference_audio_media_tokens: ["mf_audio"],
      estimate_only: {
        total_input_video_duration_millis: 7250,
        total_input_audio_duration_millis: 3500,
      },
    }),
  );
});

it("prices all selected generations for any model with API batch options", async () => {
  mocks.state.generationCount = 3;
  renderHook(() => useVideoCostEstimate(ModelPage.ImageToVideo, model, "artcraft"));
  await waitFor(() => expect(mocks.setCredits).toHaveBeenLastCalledWith(ModelPage.ImageToVideo, 126));
});

it("clears format options and clamps stale batch counts for unsupported models", async () => {
  mocks.state.generationCount = 4;
  const single = { ...model, generationCountOptions: [1], outputFormatOptions: undefined } as VideoModel;
  renderHook(() => useVideoCostEstimate(ModelPage.ImageToVideo, single, "artcraft"));
  await waitFor(() => expect(mocks.setCredits).toHaveBeenLastCalledWith(ModelPage.ImageToVideo, 42));
  expect(mocks.estimate).toHaveBeenCalledWith(expect.objectContaining({ output_format: undefined }));
});

it("does not overwrite a newer model's quote with a slow earlier response", async () => {
  let finishOld: (result: unknown) => void = () => {};
  mocks.estimate.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finishOld = resolve;
      }),
  );
  const hook = renderHook(
    ({ selected }) =>
      useVideoCostEstimate(ModelPage.ImageToVideo, selected, "artcraft"),
    { initialProps: { selected: model } },
  );
  hook.rerender({
    selected: { ...model, id: "new_model", tauriId: "new_model" } as VideoModel,
  });
  await waitFor(() =>
    expect(mocks.setCredits).toHaveBeenLastCalledWith(
      ModelPage.ImageToVideo,
      42,
    ),
  );
  await act(async () =>
    finishOld({ status: "success", payload: { cost_in_credits: 999 } }),
  );
  expect(mocks.setCredits).toHaveBeenLastCalledWith(ModelPage.ImageToVideo, 42);
});

const model = {
  id: "future_video",
  tauriId: "future_video",
  minDuration: 4,
  maxDuration: 30,
  durationOptions: undefined,
  defaultDuration: 5,
  supportsReferenceMode: true,
  resolutionOptions: ["4K"],
  bitrateOptions: ["normal", "high"],
  defaultBitrate: "normal",
  outputFormatOptions: ["mp4", "mov"],
  defaultOutputFormat: "mp4",
  generationCountOptions: [1, 2, 3, 4],
  defaultGenerationCount: 1,
  generateWithSound: true,
  sizeOptions: [{ tauriValue: "wide_sixteen_by_nine", textLabel: "16:9" }],
} as VideoModel;
