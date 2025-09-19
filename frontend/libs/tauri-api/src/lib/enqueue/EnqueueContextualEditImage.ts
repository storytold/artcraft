import { invoke } from "@tauri-apps/api/core";
import { CommandResult } from "../common/CommandStatus";
import { ImageModel } from "@storyteller/model-list";

export interface EnqueueContextualEditImageRequest {

  /// The model to use.
  model?: ImageModel | EnqueueContextualEditImageModel;

  /// If set, this is the first image in the contextual image set.
  /// This gets submitted along with `image_media_tokens` and will 
  // be prompt engineered by Tauri.
  scene_image_media_token?: string;

  /// Images to use for the image edit.
  /// The first image is typically a 2D canvas or 3D stage, but doesn't have to be.
  /// There must be at least one image.
  image_media_tokens?: string[];

  /// The user's image generation prompt.
  prompt?: string;

  /// Turn off the system prompt.
  disable_system_prompt?: boolean;

  /// Number of images to generate.
  image_count?: number;

  aspect_ratio?: EnqueueContextualEditImageSize;

  image_quality?: EnqueueContextualEditImageQuality;
}


// Shape of request sent to Tauri
// (We do some transformations from the public-facing request object.)
interface RawEnqueueContextualEditImageRequest {
  model?: EnqueueContextualEditImageModel | string;
  scene_image_media_token?: string;
  image_media_tokens?: string[];
  prompt?: string;
  disable_system_prompt?: boolean;
  image_count?: number;
  aspect_ratio?: EnqueueContextualEditImageSize;
  image_quality?: EnqueueContextualEditImageQuality;
}

export enum EnqueueContextualEditImageErrorType {
  ModelNotSpecified = "model_not_specified",
  NoProviderAvailable = "no_provider_available",
  BadRequest = "bad_request",
  ServerError = "server_error",
  TooManyConcurrentTasks = "too_many_concurrent_tasks",
  SoraLoginRequired = "sora_login_required",
  SoraUsernameNotYetCreated = "sora_username_not_yet_created",
  SoraIsHavingProblems = "sora_is_having_problems",
}

export enum EnqueueContextualEditImageModel {
  GptImage1 = "gpt_image_1",
  FluxProKontextMax = "flux_pro_kontext_max",
}

export enum EnqueueContextualEditImageSize {
  Auto = "auto",
  Square = "square",
  Wide = "wide",
  Tall = "tall",
}

export enum EnqueueContextualEditImageQuality {
  Auto = "auto",
  High = "high",
  Medium = "medium",
  Low = "low",
}

export interface EnqueueContextualEditImageError extends CommandResult {
  error_type: EnqueueContextualEditImageErrorType;
  error_message?: string;
}

export interface EnqueueContextualEditImagePayload {
}

export interface EnqueueContextualEditImageSuccess extends CommandResult {
  payload: EnqueueContextualEditImagePayload;
}

export type EnqueueContextualEditImageResult = EnqueueContextualEditImageSuccess | EnqueueContextualEditImageError;

export const EnqueueContextualEditImage = async (request: EnqueueContextualEditImageRequest) : Promise<EnqueueContextualEditImageResult> => {
  let modelName = undefined;

  if (!!request.model) {
    // NB: We can't use "instanceof" checks with Vite minification and class name mangling.
    if (typeof request.model === "string") {
      modelName = request.model;
    } else if (typeof request.model.tauriId === "string") {
      modelName = request.model.tauriId;
    }
  }

  if (!modelName) {
    throw new Error("No model specified in request: " + JSON.stringify(request));
  }

  let mutableRequest : RawEnqueueContextualEditImageRequest = {
    model: modelName,
    prompt: request.prompt,
  };

  if (!!request.scene_image_media_token) {
    mutableRequest.scene_image_media_token = request.scene_image_media_token;
  }

  if (!!request.image_media_tokens) {
    mutableRequest.image_media_tokens = request.image_media_tokens;
  }

  if (!!request.aspect_ratio) {
    mutableRequest.aspect_ratio = request.aspect_ratio;
  }

  if (!!request.image_count) {
    mutableRequest.image_count = request.image_count;
  }

  if (!!request.image_quality) {
    mutableRequest.image_quality = request.image_quality;
  }

  if (!!request.disable_system_prompt) {
    mutableRequest.disable_system_prompt = request.disable_system_prompt;
  }

  const result = await invoke("enqueue_contextual_edit_image_command", { 
    request: mutableRequest,
  });
  
  return (result as EnqueueContextualEditImageResult);
}
