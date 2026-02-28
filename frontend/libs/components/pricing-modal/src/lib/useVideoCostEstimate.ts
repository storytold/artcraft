import { useEffect, useState } from "react";
import { ModelPage } from "@storyteller/ui-model-selector";
import { Model, VideoModel } from "@storyteller/model-list";
import { GenerationProvider } from "@storyteller/api-enums";
import { usePromptVideoStore } from "@storyteller/ui-promptbox";
import {
  EstimateVideoCost,
  isEstimateVideoCostSuccess,
} from "@storyteller/tauri-api";
import { useCostBreakdownModalStore } from "./cost-breakdown-modal-store";
import {
  videoModelToCommonVideoModel,
  videoAspectRatioToCommonAspectRatio,
  videoStoreToGenerationMode,
} from "./convert/index.js";

export function useVideoCostEstimate(
  activePage: ModelPage,
  selectedModel: Model | null | undefined,
  selectedProvider: string | null | undefined,
): { isLoading: boolean } {
  const [isLoading, setIsLoading] = useState(false);
  const setEstimatedCreditsForPage = useCostBreakdownModalStore(
    (s) => s.setEstimatedCreditsForPage,
  );

  const duration = usePromptVideoStore((s) => s.duration);
  const aspectRatio = usePromptVideoStore((s) => s.aspectRatio);
  const inputMode = usePromptVideoStore((s) => s.inputMode);
  const referenceImages = usePromptVideoStore((s) => s.referenceImages);
  const endFrameImage = usePromptVideoStore((s) => s.endFrameImage);

  useEffect(() => {
    if (activePage !== ModelPage.ImageToVideo || !selectedModel) {
      return;
    }

    const commonModel = videoModelToCommonVideoModel(selectedModel.tauriId);
    if (!commonModel) {
      setEstimatedCreditsForPage(ModelPage.ImageToVideo, null);
      return;
    }

    const videoModel = selectedModel as VideoModel;
    const commonAspectRatio = videoAspectRatioToCommonAspectRatio(
      aspectRatio,
      videoModel.sizeOptions,
    );
    const generationMode = videoStoreToGenerationMode(
      inputMode,
      referenceImages,
      endFrameImage,
      videoModel.supportsReferenceMode,
    );

    const provider =
      (selectedProvider as GenerationProvider | null | undefined) ??
      GenerationProvider.Artcraft;

    setIsLoading(true);

    EstimateVideoCost({
      model: commonModel,
      provider,
      generation_mode: generationMode,
      aspect_ratio: commonAspectRatio ?? undefined,
      duration_seconds: duration ?? undefined,
    })
      .then((result) => {
        if (isEstimateVideoCostSuccess(result)) {
          const credits = result.payload.cost_in_credits ?? null;
          setEstimatedCreditsForPage(ModelPage.ImageToVideo, credits);
        } else {
          setEstimatedCreditsForPage(ModelPage.ImageToVideo, null);
        }
      })
      .catch(() => {
        setEstimatedCreditsForPage(ModelPage.ImageToVideo, null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [
    activePage,
    selectedModel?.id,
    selectedProvider,
    duration,
    aspectRatio,
    inputMode,
    referenceImages.length,
    !!endFrameImage,
  ]);

  return { isLoading };
}
