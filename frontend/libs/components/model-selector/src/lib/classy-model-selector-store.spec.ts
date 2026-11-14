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
const REMEMBERED_MODEL = IMAGE_MODELS_BY_ID.get("flux_pro_1_1_ultra")!;

afterEach(() => {
  cleanup();
  useClassyModelSelectorStore.setState({ selectedModels: {}, selectedModelIds: {}, selectedProviders: {} });
  localStorage.clear();
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

it("persists model tauriIds and providers without serializing model instances", () => {
  const page = ModelPage.TextToImage;
  const { setSelectedModel, setSelectedProvider } = useClassyModelSelectorStore.getState();
  setSelectedModel(page, REMEMBERED_MODEL);
  setSelectedProvider(page, REMEMBERED_MODEL.id, GenerationProvider.WaveSpeed);

  expect(REMEMBERED_MODEL.id).not.toBe(REMEMBERED_MODEL.tauriId);
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).state).toEqual({
    selectedModelIds: { [page]: REMEMBERED_MODEL.tauriId },
    selectedProviders: { [page]: { [REMEMBERED_MODEL.id]: GenerationProvider.WaveSpeed } },
  });
});

it("rehydrates only the remembered id and provider until catalog instances resolve", async () => {
  const page = ModelPage.TextToImage;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    state: {
      selectedModelIds: { [page]: REMEMBERED_MODEL.tauriId },
      selectedProviders: { [page]: { [REMEMBERED_MODEL.id]: GenerationProvider.WaveSpeed } },
    },
    version: 0,
  }));
  await useClassyModelSelectorStore.persist.rehydrate();

  expect(useClassyModelSelectorStore.getState().selectedModels[page]).toBeUndefined();
  expect(useClassyModelSelectorStore.getState().selectedModelIds[page]).toBe(REMEMBERED_MODEL.tauriId);
  expect(getSelectedProviderForModel(page, REMEMBERED_MODEL.id)).toBe(GenerationProvider.WaveSpeed);
});

it("keeps the remembered id through an empty catalog and temporary default", () => {
  const page = ModelPage.TextToImage;
  const defaultModel = IMAGE_MODELS_BY_ID.get("nano_banana_pro")!;
  useClassyModelSelectorStore.setState({ selectedModelIds: { [page]: REMEMBERED_MODEL.tauriId } });
  const { restoreSelectedModel } = useClassyModelSelectorStore.getState();

  restoreSelectedModel(page, []);
  expect(useClassyModelSelectorStore.getState().selectedModels[page]).toBeUndefined();
  restoreSelectedModel(page, [defaultModel]);
  expect(useClassyModelSelectorStore.getState().selectedModels[page]).toBe(defaultModel);
  expect(useClassyModelSelectorStore.getState().selectedModelIds[page]).toBe(REMEMBERED_MODEL.tauriId);
  restoreSelectedModel(page, [defaultModel, REMEMBERED_MODEL]);
  expect(useClassyModelSelectorStore.getState().selectedModels[page]).toBe(REMEMBERED_MODEL);
  expect(useClassyModelSelectorStore.getState().selectedModelIds[page]).toBe(REMEMBERED_MODEL.tauriId);
});

it("rejects unsupported provider selections before a picker can normalize them", () => {
  const page = ModelPage.Stage3D;
  const model = IMAGE_MODELS_BY_ID.get("nano_banana_pro")!;
  useClassyModelSelectorStore.setState({
    selectedModels: { [page]: model },
    selectedProviders: { [page]: { [model.id]: GenerationProvider.Midjourney } },
  });

  const { result } = renderHook(() => useSelectedProviderForModel(page, model.id));

  expect(result.current).toBe(model.getProviders()[0]);
  expect(getSelectedProviderForModel(page, model.id)).toBe(model.getProviders()[0]);
});

it("rejects persisted providers that are not present in this app", async () => {
  const page = ModelPage.TextToImage;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    state: { selectedProviders: { [page]: { unknown: "unsupported-provider" } } },
    version: 0,
  }));

  await useClassyModelSelectorStore.persist.rehydrate();

  expect(getSelectedProviderForModel(page, "unknown")).toBeUndefined();
});
