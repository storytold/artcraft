// Seeds the 3D editor's prompt-box state from the prompt that produced
// the `?output=<media_token>` media. Used by the splash example flow and
// by any lightbox/handoff that passes a rendered output through to the
// 3D editor — opening "Lone Drifter" should drop the user into the same
// prompt and model the example was generated with.
//
// Aspect ratio is intentionally not restored: Stage3DBody's cold-sync
// applies the selected model's defaultAspectRatio (16:9 for the
// InstructiveEdit-tagged models that populate STAGE_3D_PAGE_MODEL_LIST),
// which matches the common case. Prompts rendered at other aspects lose
// that nuance on prefill — acceptable for a "starting point" seed.
//
// Wire-format reminder: `prompt.maybe_model_type` matches `ImageModel.id`
// (the canonical wire-format key).

import { useEffect } from "react";
import { MediaFilesApi, PromptsApi } from "@storyteller/api";
import { IMAGE_MODELS_BY_ID } from "@storyteller/model-list";
import {
  ModelPage,
  useClassyModelSelectorStore,
} from "@storyteller/ui-model-selector";
import { usePrompt3DStore } from "@storyteller/ui-promptbox";

export function usePromptPrefillFromOutput(
  outputToken: string | null | undefined,
): void {
  useEffect(() => {
    if (!outputToken) return;
    let cancelled = false;

    (async () => {
      try {
        const mediaResp = await new MediaFilesApi().GetMediaFileByToken({
          mediaFileToken: outputToken,
        });
        if (cancelled) return;
        const promptToken = mediaResp?.data?.maybe_prompt_token;
        if (!promptToken) return;

        const promptResp = await new PromptsApi().GetPromptsByToken({
          token: promptToken,
        });
        if (cancelled) return;
        const promptData = promptResp?.data;
        if (!promptData) return;

        applyPromptText(promptData.maybe_positive_prompt);
        applyModel(promptData.maybe_model_type);
      } catch {
        // Best-effort — leaving the prefill untouched is OK; the splash
        // example simply opens with an empty prompt box.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [outputToken]);
}

function applyPromptText(text: string | null | undefined): void {
  if (!text) return;
  usePrompt3DStore.getState().setPrompt(text);
}

function applyModel(modelType: string | null | undefined): void {
  if (!modelType) return;
  const model = IMAGE_MODELS_BY_ID.get(modelType);
  if (!model) return;
  useClassyModelSelectorStore
    .getState()
    .setSelectedModel(ModelPage.Stage3D, model);
}
