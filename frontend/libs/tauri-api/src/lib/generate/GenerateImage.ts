import { invoke } from "@tauri-apps/api/core";
import { CommandResult } from "../common/CommandStatus";
import {
  CommonAspectRatio,
  CommonResolution,
  CommonQuality,
  ImageModel,
} from "@storyteller/model-list";
import { GenerationProvider } from "@storyteller/api-enums";

export interface GenerateImageRequest {
  // API-owned options may be introduced independently of this desktop build.
  [key: string]: unknown;
  // The provider to use (defaults to Artcraft/Storyteller).
  provider?: GenerationProvider;

  // The model to use.
  model?: ImageModel | string;

  // Text prompt for the image generation.
  prompt?: string;

  // Aspect ratio.
  aspect_ratio?: CommonAspectRatio | string;

  // Resolution.
  resolution?: CommonResolution | string;

  // Quality (used by OpenAI models).
  quality?: CommonQuality | string;

  // Number of images to generate.
  batch_size?: number;

  // Reference images (without semantics — purpose varies per model).
  image_media_tokens?: string[];

  // Canvas image — supply this XOR canvas_image_raw_bytes.
  // Becomes the first image reference (pushing back image_media_tokens by one).
  canvas_image_media_token?: string;
  canvas_image_raw_bytes?: Uint8Array;

  // Scene image — supply this XOR scene_image_raw_bytes.
  scene_image_media_token?: string;
  scene_image_raw_bytes?: Uint8Array;

  // Inpainting mask — supply this XOR inpainting_mask_image_raw_bytes.
  inpainting_mask_image_media_token?: string;
  inpainting_mask_image_raw_bytes?: Uint8Array;

  // Angle adjustments (for edit models like QwenEdit, Flux2LoraAngles).
  adjust_horizontal_angle?: number;
  adjust_vertical_angle?: number;
  adjust_zoom?: number;

  // Turn on the system prompt.
  enable_system_prompt?: boolean;

  // Frontend metadata.
  frontend_caller?: string;
  frontend_subscriber_id?: string;
  frontend_subscriber_payload?: string;
}

export enum GenerateImageErrorType {
  ModelNotSpecified = "model_not_specified",
  BadInput = "bad_input",
  NoProviderAvailable = "no_provider_available",
  ServerError = "server_error",
  NeedsStorytellerCredentials = "needs_storyteller_credentials",
  NeedsGrokCredentials = "needs_grok_credentials",
  BillingIssue = "billing_issue",
}

export interface GenerateImageError extends CommandResult {
  error_type: GenerateImageErrorType;
  error_message?: string;
}

export type GenerateImagePayload = Record<string, never>;

export interface GenerateImageSuccess extends CommandResult {
  payload: GenerateImagePayload;
}

export type GenerateImageResult = GenerateImageSuccess | GenerateImageError;

export const GenerateImage = async (
  request: GenerateImageRequest,
): Promise<GenerateImageResult> => {
  let modelName: string | undefined;

  if (!!request.model) {
    if (typeof request.model === "string") {
      modelName = request.model;
    } else if (typeof request.model.tauriId === "string") {
      modelName = request.model.tauriId;
    }
  }

  if (!modelName) {
    throw new Error(
      "No model specified in request: " + JSON.stringify(request),
    );
  }

  const mutableRequest = { ...request, model: modelName };

  const result = await invoke("generate_image_command", {
    request: mutableRequest,
  });

  return result as GenerateImageResult;
};
