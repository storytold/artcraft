import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { GenerationProvider } from "@storyteller/api-enums";
import { ModelPage } from "./model-pages";
import {
  getSelectedProviderForModel,
  useClassyModelSelectorStore,
  useSelectedProviderForModel,
} from "./classy-model-selector-store";

const RETIRED_SELECTIONS = [
  { page: ModelPage.TextToImage, modelId: "gpt_image_1", provider: GenerationProvider.Sora },
  { page: ModelPage.ImageToVideo, modelId: "sora_2", provider: GenerationProvider.Sora },
  { page: ModelPage.ImageTo3DWorld, modelId: "marble_0p1_plus", provider: GenerationProvider.WorldLabs },
];

afterEach(() => {
  cleanup();
  useClassyModelSelectorStore.setState({ selectedModels: {}, selectedProviders: {} });
});

it.each(RETIRED_SELECTIONS)(
  "uses ArtCraft for stale $provider selections of $modelId in generation and pricing",
  ({ page, modelId, provider }) => {
    useClassyModelSelectorStore.setState({
      selectedProviders: { [page]: { [modelId]: provider } },
    });
    const { result } = renderHook(() => useSelectedProviderForModel(page, modelId));
    expect(result.current).toBe(GenerationProvider.Artcraft);
    expect(getSelectedProviderForModel(page, modelId)).toBe(GenerationProvider.Artcraft);

    act(() => useClassyModelSelectorStore.getState().setSelectedProvider(page, modelId, provider));
    expect(useClassyModelSelectorStore.getState().selectedProviders[page]?.[modelId])
      .toBe(GenerationProvider.Artcraft);
  },
);

it("preserves other provider selections and missing defaults", () => {
  const page = ModelPage.TextToImage;
  const modelId = "midjourney";
  const { result } = renderHook(() => useSelectedProviderForModel(page, modelId));
  expect(result.current).toBeUndefined();
  act(() => useClassyModelSelectorStore.getState().setSelectedProvider(page, modelId, GenerationProvider.Midjourney));
  expect(result.current).toBe(GenerationProvider.Midjourney);
  expect(getSelectedProviderForModel(page, modelId)).toBe(GenerationProvider.Midjourney);
});
