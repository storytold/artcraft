import { create } from "zustand";
import { ModelPage } from "./model-pages";
import { ImageModel, Model, VideoModel } from "@storyteller/model-list";
import { GenerationProvider } from "@storyteller/api-enums";

type ModelSelectionSource = "automatic" | "explicit";

interface ClassyModelSelectorState {
  selectedModels: { [page in ModelPage]?: Model };
  modelSelectionSources: {
    [page in ModelPage]?: ModelSelectionSource;
  };
  selectedProviders: { [page in ModelPage]?: { [modelId: string]: GenerationProvider } };
  setSelectedModel: (page: ModelPage, model: Model) => void;
  reconcileSelectedModelFromCatalog: (
    page: ModelPage,
    models: Model[],
    defaultModel: Model | undefined
  ) => void;
  setSelectedProvider: (
    page: ModelPage,
    modelId: string,
    provider: GenerationProvider
  ) => void;
}

export const useClassyModelSelectorStore = create<ClassyModelSelectorState>(
  (set) => ({
    selectedModels: {},
    modelSelectionSources: {},
    selectedProviders: {},
    setSelectedModel: (page, model) =>
      set((state) => ({
        selectedModels: {
          ...state.selectedModels,
          [page]: model,
        },
        modelSelectionSources: {
          ...state.modelSelectionSources,
          [page]: "explicit",
        },
      })),
    reconcileSelectedModelFromCatalog: (page, models, defaultModel) =>
      set((state) => {
        if (models.length === 0) return state;

        const selected = state.selectedModels[page];
        const refreshed = selected
          ? models.find((model) => model.tauriId === selected.tauriId)
          : undefined;
        const availableDefault = defaultModel
          ? (models.find((model) => model.tauriId === defaultModel.tauriId) ??
            models[0])
          : models[0];
        const automatic = state.modelSelectionSources[page] === "automatic";
        const nextSelected = selected
          ? automatic
            ? (availableDefault ?? refreshed ?? selected)
            : (refreshed ?? selected)
          : availableDefault;

        if (!nextSelected || nextSelected === selected) return state;

        return {
          selectedModels: {
            ...state.selectedModels,
            [page]: nextSelected,
          },
          modelSelectionSources: selected
            ? state.modelSelectionSources
            : {
                ...state.modelSelectionSources,
                [page]: "automatic",
              },
        };
      }),
    setSelectedProvider: (page, modelId, provider) =>
      set((state) => ({
        selectedProviders: {
          ...state.selectedProviders,
          [page]: {
            ...(state.selectedProviders[page] ?? {}),
            [modelId]: provider,
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
  return byPage[modelId];
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
    modelId ? s.selectedProviders[page]?.[modelId] : undefined
  );
