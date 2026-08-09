import { useEffect, useState } from "react";
import { ModelPage } from "@storyteller/ui-model-selector";
import {
  hasVideoDurationConfiguration,
  Model,
  projectVideoDuration,
  VideoModel,
} from "@storyteller/model-list";
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
  stringToCommonVideoResolution,
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
  const resolution = usePromptVideoStore((s) => s.resolution);
  const inputMode = usePromptVideoStore((s) => s.inputMode);
  const referenceImages = usePromptVideoStore((s) => s.referenceImages);
  const endFrameImage = usePromptVideoStore((s) => s.endFrameImage);
  const generateWithSound = usePromptVideoStore((s) => s.generateWithSound);
  const videoModel =
    selectedModel?.kind === "video_model"
      ? (selectedModel as VideoModel)
      : null;
  const effectiveReferenceMode =
    inputMode === "reference" && !!videoModel?.supportsReferenceMode;
  const resolvedDuration = videoModel
    ? projectVideoDuration(videoModel, {
        storedDuration: duration,
        effectiveReferenceMode,
        imageCount: referenceImages.length,
        hasEndFrameImage: !!endFrameImage,
      }).estimateDuration
    : null;

  useEffect(() => {
    if (activePage !== ModelPage.ImageToVideo) {
      setEstimatedCreditsForPage(ModelPage.ImageToVideo, null);
      setIsLoading(false);
      return;
    }
    if (!videoModel) {
      setEstimatedCreditsForPage(ModelPage.ImageToVideo, null);
      setIsLoading(false);
      return;
    }
    if (
      resolvedDuration === null &&
      hasVideoDurationConfiguration(videoModel)
    ) {
      setEstimatedCreditsForPage(ModelPage.ImageToVideo, null);
      setIsLoading(false);
      return;
    }

    const commonModel = videoModelToCommonVideoModel(videoModel.tauriId);
    if (!commonModel) {
      setEstimatedCreditsForPage(ModelPage.ImageToVideo, null);
      setIsLoading(false);
      return;
    }

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

    // The prompt store is authoritative immediately. Debounce only the remote
    // estimate call so the UI never displays the previous quote beside a newly
    // selected duration while still avoiding a request for every drag event.
    setEstimatedCreditsForPage(ModelPage.ImageToVideo, null);
    setIsLoading(true);
    let cancelled = false;
    const estimateTimer = setTimeout(() => {
      EstimateVideoCost({
        model: commonModel,
        provider,
        generation_mode: generationMode,
        aspect_ratio: commonAspectRatio ?? undefined,
        resolution: commonResolution ?? undefined,
        duration_seconds: resolvedDuration ?? undefined,
        generate_audio: generateWithSound,
      })
        .then((result) => {
          if (cancelled) return;
          if (isEstimateVideoCostSuccess(result)) {
            const credits = result.payload.cost_in_credits ?? null;
            setEstimatedCreditsForPage(ModelPage.ImageToVideo, credits);
          } else {
            setEstimatedCreditsForPage(ModelPage.ImageToVideo, null);
          }
        })
        .catch(() => {
          if (cancelled) return;
          setEstimatedCreditsForPage(ModelPage.ImageToVideo, null);
        })
        .finally(() => {
          if (cancelled) return;
          setIsLoading(false);
        });
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(estimateTimer);
    };
  }, [
    activePage,
    videoModel,
    selectedProvider,
    resolvedDuration,
    aspectRatio,
    resolution,
    inputMode,
    effectiveReferenceMode,
    referenceImages.length,
    !!endFrameImage,
    generateWithSound,
    setEstimatedCreditsForPage,
  ]);

  return { isLoading };
}
