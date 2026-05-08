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
  // The provider to use (defaults to Artcraft/Storyteller).
  provider?: GenerationProvider;

  // The model to use.
  model?: ImageModel | string;

  // Text prompt for the image generation.
  prompt?: string;

  // Aspect ratio.
  aspect_ratio?: CommonAspectRatio;

  // Resolution.
  resolution?: CommonResolution;

  // Quality (used by OpenAI models).
  quality?: CommonQuality;

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

interface RawGenerateImageRequest {
  provider?: GenerationProvider;
  model?: string;
  prompt?: string;
  aspect_ratio?: CommonAspectRatio;
  resolution?: CommonResolution;
  quality?: CommonQuality;
  batch_size?: number;
  image_media_tokens?: string[];
  canvas_image_media_token?: string;
  canvas_image_raw_bytes?: Uint8Array;
  scene_image_media_token?: string;
  scene_image_raw_bytes?: Uint8Array;
  inpainting_mask_image_media_token?: string;
  inpainting_mask_image_raw_bytes?: Uint8Array;
  adjust_horizontal_angle?: number;
  adjust_vertical_angle?: number;
  adjust_zoom?: number;
  enable_system_prompt?: boolean;
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

  const mutableRequest: RawGenerateImageRequest = {
    model: modelName,
  };

  if (!!request.provider) mutableRequest.provider = request.provider;
  if (!!request.prompt) mutableRequest.prompt = request.prompt;
  if (!!request.aspect_ratio) mutableRequest.aspect_ratio = request.aspect_ratio;
  if (!!request.resolution) mutableRequest.resolution = request.resolution;
  if (!!request.quality) mutableRequest.quality = request.quality;
  if (typeof request.batch_size === "number") mutableRequest.batch_size = request.batch_size;
  if (!!request.image_media_tokens && request.image_media_tokens.length > 0) {
    mutableRequest.image_media_tokens = request.image_media_tokens;
  }
  if (!!request.canvas_image_media_token) {
    mutableRequest.canvas_image_media_token = request.canvas_image_media_token;
  }
  if (!!request.canvas_image_raw_bytes) {
    mutableRequest.canvas_image_raw_bytes = request.canvas_image_raw_bytes;
  }
  if (!!request.scene_image_media_token) {
    mutableRequest.scene_image_media_token = request.scene_image_media_token;
  }
  if (!!request.scene_image_raw_bytes) {
    mutableRequest.scene_image_raw_bytes = request.scene_image_raw_bytes;
  }
  if (!!request.inpainting_mask_image_media_token) {
    mutableRequest.inpainting_mask_image_media_token = request.inpainting_mask_image_media_token;
  }
  if (!!request.inpainting_mask_image_raw_bytes) {
    mutableRequest.inpainting_mask_image_raw_bytes = request.inpainting_mask_image_raw_bytes;
  }
  if (typeof request.adjust_horizontal_angle === "number") {
    mutableRequest.adjust_horizontal_angle = request.adjust_horizontal_angle;
  }
  if (typeof request.adjust_vertical_angle === "number") {
    mutableRequest.adjust_vertical_angle = request.adjust_vertical_angle;
  }
  if (typeof request.adjust_zoom === "number") {
    mutableRequest.adjust_zoom = request.adjust_zoom;
  }
  if (typeof request.enable_system_prompt === "boolean") {
    mutableRequest.enable_system_prompt = request.enable_system_prompt;
  }
  if (!!request.frontend_caller) mutableRequest.frontend_caller = request.frontend_caller;
  if (!!request.frontend_subscriber_id) {
    mutableRequest.frontend_subscriber_id = request.frontend_subscriber_id;
  }
  if (!!request.frontend_subscriber_payload) {
    mutableRequest.frontend_subscriber_payload = request.frontend_subscriber_payload;
  }

  const result = await invoke("generate_image_command", {
    request: mutableRequest,
  });

  return result as GenerateImageResult;
};
