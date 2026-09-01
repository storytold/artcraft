import { useEffect } from "react";
import { ModelPage } from "@storyteller/ui-model-selector";
import { Model, VideoModel } from "@storyteller/model-list";
import { GenerationProvider } from "@storyteller/api-enums";
import { usePromptVideoStore } from "@storyteller/ui-promptbox";
import {
  EstimateVideoCost,
  isEstimateVideoCostSuccess,
} from "@storyteller/tauri-api";
import { useCostEstimateLifecycle } from "./useCostEstimateLifecycle";
import {
  videoModelToCommonVideoModel,
  videoAspectRatioToCommonAspectRatio,
  videoStoreToGenerationMode,
  stringToCommonVideoResolution,
} from "./convert/index.js";

export function useVideoCostEstimate(
  activePage: ModelPage,
  selectedModel: Model | null | undefined,
  selectedProvider: string | null | undefined,
): { isLoading: boolean } {
  const { isLoading, begin, clear } = useCostEstimateLifecycle();

  const duration = usePromptVideoStore((s) => s.duration);
  const aspectRatio = usePromptVideoStore((s) => s.aspectRatio);
  const resolution = usePromptVideoStore((s) => s.resolution);
  const inputMode = usePromptVideoStore((s) => s.inputMode);
  const referenceImages = usePromptVideoStore((s) => s.referenceImages);
  const endFrameImage = usePromptVideoStore((s) => s.endFrameImage);
  const generateWithSound = usePromptVideoStore((s) => s.generateWithSound);

  useEffect(() => {
    if (activePage !== ModelPage.ImageToVideo || !selectedModel) {
      clear(ModelPage.ImageToVideo);
      return;
    }

    const commonModel = videoModelToCommonVideoModel(selectedModel.tauriId);
    if (!commonModel) {
      clear(ModelPage.ImageToVideo);
      return;
    }

    const videoModel = selectedModel as VideoModel;
    const commonAspectRatio = videoAspectRatioToCommonAspectRatio(
      aspectRatio,
      videoModel.sizeOptions,
    );
    const commonResolution = stringToCommonVideoResolution(resolution);
    const generationMode = videoStoreToGenerationMode(
      inputMode,
      referenceImages,
      endFrameImage,
      videoModel.supportsReferenceMode,
    );

    const provider =
      (selectedProvider as GenerationProvider | null | undefined) ??
      GenerationProvider.Artcraft;

    const request = begin(ModelPage.ImageToVideo);
    void (async () => {
      try {
        const result = await EstimateVideoCost({
          model: commonModel,
          provider,
          generation_mode: generationMode,
          aspect_ratio: commonAspectRatio ?? undefined,
          resolution: commonResolution ?? undefined,
          duration_seconds: duration ?? undefined,
          generate_audio: generateWithSound,
        });
        request.settle(
          isEstimateVideoCostSuccess(result)
            ? (result.payload.cost_in_credits ?? null)
            : null,
        );
      } catch {
        request.settle(null);
      }
    })();

    return request.cancel;
  }, [
    activePage,
    selectedModel,
    selectedProvider,
    duration,
    aspectRatio,
    resolution,
    inputMode,
    referenceImages.length,
    !!endFrameImage,
    generateWithSound,
    begin,
    clear,
  ]);

  return { isLoading };
}
