import { create } from "zustand";
import { ModelPage } from "./model-pages";
import { ImageModel, Model, VideoModel } from "@storyteller/model-list";
import { GenerationProvider } from "@storyteller/api-enums";

interface ClassyModelSelectorState {
  selectedModels: { [page in ModelPage]?: Model };
  selectedProviders: { [page in ModelPage]?: { [modelId: string]: GenerationProvider } };
  setSelectedModel: (page: ModelPage, model: Model) => void;
  setSelectedProvider: (
    page: ModelPage,
    modelId: string,
    provider: GenerationProvider
  ) => void;
}

export const useClassyModelSelectorStore = create<ClassyModelSelectorState>(
  (set) => ({
    selectedModels: {},
    selectedProviders: {},
    setSelectedModel: (page, model) =>
      set((state) => ({
        selectedModels: {
          ...state.selectedModels,
          [page]: model,
        },
      })),
    setSelectedProvider: (page, modelId, provider) =>
      set((state) => ({
        selectedProviders: {
          ...state.selectedProviders,
          [page]: {
            ...(state.selectedProviders[page] ?? {}),
            [modelId]: resolveSelectedProvider(provider)!,
          },
        },
      })),
  })
);

export const getSelectedImageModel = (
  page: ModelPage
): ImageModel | undefined => {
  const { selectedModels } = useClassyModelSelectorStore.getState();
  const maybeModel = selectedModels[page];
  if (!maybeModel) {
    return undefined;
  }
  // NB: We can't use "instanceof" checks with Vite minification and class name mangling.
  // We have to do type tagging a different way.
  if (maybeModel.kind === "image_model") {
    return maybeModel as ImageModel;
  }
  return undefined;
};

export const getSelectedVideoModel = (
  page: ModelPage
): VideoModel | undefined => {
  const { selectedModels } = useClassyModelSelectorStore.getState();
  const maybeModel = selectedModels[page];
  if (!maybeModel) {
    return undefined;
  }
  // NB: We can't use "instanceof" checks with Vite minification and class name mangling.
  // We have to do type tagging a different way.
  if (maybeModel.kind !== "video_model") {
    return undefined;
  }
  return maybeModel as VideoModel;
};

export const getSelectedProviderForModel = (
  page: ModelPage,
  modelId: string
): GenerationProvider | undefined => {
  const { selectedProviders } = useClassyModelSelectorStore.getState();
  const byPage = selectedProviders[page];
  if (!byPage) return undefined;
  return resolveSelectedProvider(byPage[modelId]);
};

// Reactive hooks for UI subscriptions
export const useSelectedModel = (page: ModelPage): Model | undefined =>
  useClassyModelSelectorStore((s) => s.selectedModels[page]);

export const useSelectedImageModel = (
  page: ModelPage
): ImageModel | undefined => {
  const maybeModel = useSelectedModel(page);
  if (!maybeModel) return undefined;
  return maybeModel.kind === "image_model"
    ? (maybeModel as ImageModel)
    : undefined;
};

export const useSelectedVideoModel = (
  page: ModelPage
): VideoModel | undefined => {
  const maybeModel = useSelectedModel(page);
  if (!maybeModel) return undefined;
  return maybeModel.kind === "video_model"
    ? (maybeModel as VideoModel)
    : undefined;
};

// TODO: This shouldn't be on a per-page basis.
export const useSelectedProviderForModel = (
  page: ModelPage,
  modelId: string | undefined
): GenerationProvider | undefined =>
  useClassyModelSelectorStore((s) =>
    modelId ? resolveSelectedProvider(s.selectedProviders[page]?.[modelId]) : undefined
  );

function resolveSelectedProvider(
  provider: GenerationProvider | undefined,
): GenerationProvider | undefined {
  // Retired direct accounts must not reach generation or pricing requests,
  // including when an older selection is still in state.
  if (
    provider === GenerationProvider.Sora ||
    provider === GenerationProvider.WorldLabs
  ) {
    return GenerationProvider.Artcraft;
  }
  return provider;
}
