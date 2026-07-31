/**
 * `/v1/prompts` — the settings a generation was submitted with.
 *
 * The frontend's "recreate" flow reads these back to repopulate the prompt box,
 * so the record has to round-trip whatever was submitted.
 */

import type { RequestContext } from "../http/context.ts";
import { HttpResult, notFound, success } from "../http/respond.ts";
import type { Router } from "../http/router.ts";
import type { PromptRecord } from "../state/entities.ts";
import { store } from "../state/store.ts";
import { mediaLinks } from "../wire/media.ts";

export function registerPromptRoutes(router: Router): void {
  router.get("/v1/prompts/:token", getPrompt);
  router.get("/v1/prompt/batch", batchGetPrompts);
}

function getPrompt(context: RequestContext): HttpResult {
  const prompt = store.promptsByToken.get(context.params["token"] ?? "");
  if (prompt === undefined) {
    return notFound();
  }
  return success({ prompt: promptPayload(prompt) });
}

function batchGetPrompts(context: RequestContext): HttpResult {
  const requested = context.query.getAll("tokens").flatMap((value) => value.split(","));
  const wanted = new Set(requested.filter((token) => token.length > 0));

  const prompts = [...wanted]
    .map((token) => store.promptsByToken.get(token))
    .filter((prompt) => prompt !== undefined)
    .map(promptPayload);

  return success({ prompts });
}

function promptPayload(prompt: PromptRecord): object {
  return {
    token: prompt.token,
    prompt_type: prompt.promptType,
    created_at: prompt.createdAt,
    lcm_disabled: false,
    lipsync_enabled: false,
    use_cinematic: false,
    used_face_detailer: false,
    used_upscaler: false,
    maybe_aspect_ratio: prompt.maybeAspectRatio ?? null,
    maybe_batch_count: prompt.maybeBatchCount ?? null,
    maybe_context_images: contextImagesPayload(prompt),
    maybe_duration_seconds: prompt.maybeDurationSeconds ?? null,
    maybe_frame_skip: null,
    maybe_generate_audio: prompt.maybeGenerateAudio ?? null,
    maybe_generation_mode: null,
    maybe_generation_provider: prompt.maybeGenerationProvider ?? null,
    maybe_global_ipa_image_token: null,
    maybe_inference_duration_millis: null,
    maybe_model_class: prompt.maybeModelClass ?? null,
    maybe_model_type: prompt.maybeModelType ?? null,
    maybe_moderator_fields: null,
    maybe_negative_prompt: prompt.maybeNegativePrompt ?? null,
    maybe_positive_prompt: prompt.maybePositivePrompt ?? null,
    maybe_resolution: prompt.maybeResolution ?? null,
    maybe_strength: null,
    maybe_style_name: prompt.maybeStyleName ?? null,
    maybe_travel_prompt: null,
  };
}

function contextImagesPayload(prompt: PromptRecord): object[] | null {
  const images = prompt.contextImageMediaTokens
    .map((token) => store.mediaFilesByToken.get(token))
    .filter((record) => record !== undefined)
    .map((record) => ({
      media_token: record.token,
      semantic: "reference",
      media_links: mediaLinks(record),
    }));

  return images.length === 0 ? null : images;
}
