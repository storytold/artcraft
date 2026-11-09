import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ModelPage } from "./model-pages";
import { ImageModel, Model, VideoModel } from "@storyteller/model-list";
import { GenerationProvider } from "@storyteller/api-enums";
import { defaultModelForPage } from "./defaultModelForPage";

interface ClassyModelSelectorState {
  selectedModels: { [page in ModelPage]?: Model };
  selectedModelIds: { [page in ModelPage]?: string };
  selectedProviders: { [page in ModelPage]?: { [modelId: string]: GenerationProvider } };
  setSelectedModel: (page: ModelPage, model: Model) => void;
  restoreSelectedModel: (page: ModelPage, models: Model[]) => void;
  setSelectedProvider: (
    page: ModelPage,
    modelId: string,
    provider: GenerationProvider
  ) => void;
}

export const useClassyModelSelectorStore = create<ClassyModelSelectorState>()(
  persist((set) => ({
    selectedModels: {},
    selectedModelIds: {},
    selectedProviders: {},
    setSelectedModel: (page, model) =>
      set((state) => ({
        selectedModels: {
          ...state.selectedModels,
          [page]: model,
        },
        selectedModelIds: {
          ...state.selectedModelIds,
          [page]: model.tauriId,
        },
      })),
    restoreSelectedModel: (page, models) =>
      set((state) => {
        const current = state.selectedModels[page];
        const next =
          models.find((model) => model.tauriId === state.selectedModelIds[page]) ??
          (current && models.find((model) => model.tauriId === current.tauriId)) ??
          current ??
          (models.length > 0 ? defaultModelForPage(models, page) : undefined);
        if (next === undefined || next === current) return state;
        return { selectedModels: { ...state.selectedModels, [page]: next } };
      }),
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
  }), {
    name: "artcraft-model-selections",
    partialize: (state) => ({
      selectedModelIds: state.selectedModelIds,
      selectedProviders: state.selectedProviders,
    }),
  }),
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
  const { selectedModels, selectedProviders } = useClassyModelSelectorStore.getState();
  const byPage = selectedProviders[page];
  if (!byPage) return undefined;
  const model = selectedModels[page];
  return resolveSelectedProvider(byPage[modelId], model?.id === modelId ? model : undefined);
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
    modelId ? resolveSelectedProvider(
      s.selectedProviders[page]?.[modelId],
      s.selectedModels[page]?.id === modelId ? s.selectedModels[page] : undefined,
    ) : undefined
  );

function resolveSelectedProvider(
  provider: GenerationProvider | undefined,
  model?: Model,
): GenerationProvider | undefined {
  // Retired direct accounts must not reach generation or pricing requests,
  // including when an older selection is still in state.
  const resolvedProvider =
    provider === GenerationProvider.Sora ||
    provider === GenerationProvider.WorldLabs
      ? GenerationProvider.Artcraft
      : provider;
  if (resolvedProvider === undefined) return undefined;
  const allowedProviders = model?.getProviders();
  if (allowedProviders && !allowedProviders.includes(resolvedProvider)) {
    return allowedProviders[0];
  }
  return Object.values(GenerationProvider).includes(resolvedProvider)
    ? resolvedProvider
    : undefined;
}
