import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { GenerationProvider } from "@storyteller/api-enums";
import { IMAGE_MODELS_BY_ID } from "@storyteller/model-list";
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
const STORAGE_KEY = "artcraft-model-selections";
// Its id and tauriId differ, so the tests pin down which one is remembered.
const REMEMBERED_MODEL = IMAGE_MODELS_BY_ID.get("flux_pro_1_1_ultra")!;

afterEach(() => {
  cleanup();
  localStorage.clear();
  useClassyModelSelectorStore.setState({ selectedModels: {}, selectedModelIds: {}, selectedProviders: {} });
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

it("persists the selected model's tauriId and providers, but not the model instances", () => {
  const page = ModelPage.TextToImage;
  const { setSelectedModel, setSelectedProvider } = useClassyModelSelectorStore.getState();
  setSelectedModel(page, REMEMBERED_MODEL);
  setSelectedProvider(page, REMEMBERED_MODEL.id, GenerationProvider.OpenRouter);

  const raw = localStorage.getItem(STORAGE_KEY);
  expect(raw).not.toBeNull();
  const { state } = JSON.parse(raw!);
  expect(state.selectedModelIds).toEqual({ [page]: REMEMBERED_MODEL.tauriId });
  expect(state.selectedProviders).toEqual({
    [page]: { [REMEMBERED_MODEL.id]: GenerationProvider.OpenRouter },
  });
  expect(state).not.toHaveProperty("selectedModels");
});

it("restores the remembered model id and provider on rehydrate", async () => {
  const page = ModelPage.TextToImage;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    state: {
      selectedModelIds: { [page]: REMEMBERED_MODEL.tauriId },
      selectedProviders: { [page]: { [REMEMBERED_MODEL.id]: GenerationProvider.OpenRouter } },
    },
    version: 0,
  }));

  await useClassyModelSelectorStore.persist.rehydrate();

  expect(useClassyModelSelectorStore.getState().selectedModelIds[page]).toBe(REMEMBERED_MODEL.tauriId);
  expect(getSelectedProviderForModel(page, REMEMBERED_MODEL.id)).toBe(GenerationProvider.OpenRouter);
});

it("shows the page default without forgetting a remembered model that isn't listed yet", () => {
  const page = ModelPage.TextToImage;
  const defaultModel = IMAGE_MODELS_BY_ID.get("nano_banana_pro")!;
  useClassyModelSelectorStore.setState({ selectedModelIds: { [page]: REMEMBERED_MODEL.tauriId } });

  useClassyModelSelectorStore.getState().restoreSelectedModel(page, [defaultModel]);
  expect(useClassyModelSelectorStore.getState().selectedModels[page]).toBe(defaultModel);
  expect(useClassyModelSelectorStore.getState().selectedModelIds[page]).toBe(REMEMBERED_MODEL.tauriId);

  useClassyModelSelectorStore.getState().restoreSelectedModel(page, [defaultModel, REMEMBERED_MODEL]);
  expect(useClassyModelSelectorStore.getState().selectedModels[page]).toBe(REMEMBERED_MODEL);
  expect(useClassyModelSelectorStore.getState().selectedModelIds[page]).toBe(REMEMBERED_MODEL.tauriId);
});
