import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { ModelPage } from "@storyteller/ui-model-selector";
import {
  buildImageModelsFromListing,
  type ImageModel,
} from "@storyteller/model-list";
import { useImageCostEstimate } from "./useImageCostEstimate";

const mocks = vi.hoisted(() => ({
  estimate: vi.fn(),
  setCredits: vi.fn(),
  canvas2D: {
    aspectRatio: "auto",
    resolution: "1k",
    referenceImages: [],
    generationCount: 1,
  },
}));

vi.mock("@storyteller/ui-promptbox", () => ({
  usePromptImageStore: (select: any) =>
    select({ referenceImages: [], generationCount: 1 }),
  usePrompt2DStore: (select: any) => select(mocks.canvas2D),
  usePrompt3DStore: (select: any) => select({ resolution: "1k", referenceImages: [] }),
  usePromptEditStore: (select: any) =>
    select({ aspectRatio: "auto", resolution: "1k", referenceImages: [] }),
}));
vi.mock("@storyteller/ui-model-selector", () => ({
  ModelPage: {
    TextToImage: "text-to-image",
    Canvas2D: "canvas-2d",
    Stage3D: "stage-3d",
    ImageEditor: "image-editor",
    Angles: "angles",
  },
}));
vi.mock("@storyteller/tauri-api", () => ({
  EstimateImageCost: mocks.estimate,
  isEstimateImageCostSuccess: (result: any) => result.status === "success",
}));
vi.mock("./cost-breakdown-modal-store", () => ({
  useCostBreakdownModalStore: (select: any) =>
    select({ setEstimatedCreditsForPage: mocks.setCredits }),
}));

const [NANO_BANANA_PRO, SEEDREAM_4, GPT_IMAGE_1P5] = buildImageModelsFromListing([], [
  { model: "nano_banana_pro", aspect_ratio_options: ["auto", "square", "wide_sixteen_by_nine"] },
  { model: "seedream_4", aspect_ratio_options: ["auto_2k", "auto_4k", "square"] },
  { model: "gpt_image_1p5", aspect_ratio_options: ["square", "wide", "tall"] },
]);

beforeEach(() => {
  mocks.canvas2D.aspectRatio = "auto";
  mocks.estimate.mockReset();
  mocks.setCredits.mockReset();
  mocks.estimate.mockResolvedValue({
    status: "success",
    payload: { cost_in_credits: 12 },
  });
});

it.each([
  ["a model with an auto option", NANO_BANANA_PRO, "auto"],
  ["a model whose auto option also picks a resolution", SEEDREAM_4, "auto_2k"],
  ["a model with no auto option, which leaves it to the API", GPT_IMAGE_1P5, undefined],
])("quotes an edit that keeps the base image's shape for %s", async (_name, model, expected) => {
  await quoteCanvas2D(model);
  expect(mocks.estimate).toHaveBeenCalledWith(
    expect.objectContaining({ aspect_ratio: expected }),
  );
});

it.each([
  ["wide", "wide"],
  ["tall", "tall"],
  ["square", "square"],
])("quotes the %s ratio picked by the user as before", async (picked, expected) => {
  mocks.canvas2D.aspectRatio = picked;
  await quoteCanvas2D(GPT_IMAGE_1P5);
  expect(mocks.estimate).toHaveBeenCalledWith(
    expect.objectContaining({ aspect_ratio: expected }),
  );
});

async function quoteCanvas2D(model: ImageModel) {
  renderHook(() => useImageCostEstimate(ModelPage.Canvas2D, model, "artcraft"));
  await waitFor(() =>
    expect(mocks.setCredits).toHaveBeenLastCalledWith(ModelPage.Canvas2D, 12),
  );
}
