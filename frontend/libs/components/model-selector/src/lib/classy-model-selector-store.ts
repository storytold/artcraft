import { create } from "zustand";
import { ModelPage } from "./model-pages";
import { ImageModel, Model, VideoModel } from "@storyteller/model-list";

interface ClassyModelSelectorState {
  selectedModels: { [page in ModelPage]?: Model };
  setSelectedModel: (page: ModelPage, model: Model) => void;
}

export const useClassyModelSelectorStore = create<ClassyModelSelectorState>((set) => ({
  selectedModels: {},
  setSelectedModel: (page, model) =>
    set((state) => ({
      selectedModels: {
        ...state.selectedModels,
        [page]: model,
      },
    })),
}));

export const getSelectedImageModel = (page: ModelPage) : ImageModel | undefined => {
  const { selectedModels } = useClassyModelSelectorStore();
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

export const getSelectedVideoModel = (page: ModelPage) : VideoModel | undefined => {
  const { selectedModels } = useClassyModelSelectorStore();
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
