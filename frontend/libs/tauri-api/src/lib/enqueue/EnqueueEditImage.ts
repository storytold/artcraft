import { invoke } from "@tauri-apps/api/core";
import { CommandResult } from "../common/CommandStatus";
import { CommonAspectRatio, ImageModel } from "@storyteller/model-list";
import { GenerationProvider } from "@storyteller/api-enums";

export interface EnqueueEditImageRequest {
  /// The model to use.
  model?: ImageModel | EnqueueEditImageModel;

  // The provider to use.
  provider?: GenerationProvider;

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

  // TODO: This is deprecated and will be phased out.
  aspect_ratio?: EnqueueEditImageSize;

  // This is the new aspect ratio.
  common_aspect_ratio?: CommonAspectRatio;

  image_quality?: EnqueueEditImageQuality;

  /// Image resolution. Support: Nano Banana Pro
  image_resolution?: EnqueueEditImageResolution;

  /// Horizontal angle (rotation) for angle edit models.
  horizontal_angle?: number;

  /// Vertical angle (tilt) for angle edit models.
  vertical_angle?: number;

  /// Zoom for angle edit models.
  zoom?: number;

  // TODO: Actual enum.
  frontend_caller?: string;

  // Optional frontend state to return later.
  frontend_subscriber_id?: string;
}


// Shape of request sent to Tauri
// (We do some transformations from the public-facing request object.)
interface RawEnqueueEditImageRequest {
  model?: EnqueueEditImageModel | string;
  provider?: GenerationProvider;
  scene_image_media_token?: string;
  image_media_tokens?: string[];
  prompt?: string;
  disable_system_prompt?: boolean;
  image_count?: number;
  aspect_ratio?: EnqueueEditImageSize;
  common_aspect_ratio?: CommonAspectRatio;
  image_quality?: EnqueueEditImageQuality;
  horizontal_angle?: number;
  vertical_angle?: number;
  zoom?: number;
  frontend_caller?: string;
  frontend_subscriber_id?: string;
}

export enum EnqueueEditImageErrorType {
  ModelNotSpecified = "model_not_specified",
  NoProviderAvailable = "no_provider_available",
  BadRequest = "bad_request",
  ServerError = "server_error",
  TooManyConcurrentTasks = "too_many_concurrent_tasks",
  SoraLoginRequired = "sora_login_required",
  SoraUsernameNotYetCreated = "sora_username_not_yet_created",
  SoraIsHavingProblems = "sora_is_having_problems",
}

export enum EnqueueEditImageModel {
  GptImage1 = "gpt_image_1",
  FluxProKontextMax = "flux_pro_kontext_max",
}

export enum EnqueueEditImageSize {
  Auto = "auto",
  Square = "square",
  Wide = "wide",
  Tall = "tall",
}

export enum EnqueueEditImageQuality {
  Auto = "auto",
  High = "high",
  Medium = "medium",
  Low = "low",
}

export enum EnqueueEditImageResolution {
  OneK = "one_k",
  TwoK = "two_k",
  FourK = "four_k",
}

export interface EnqueueEditImageError extends CommandResult {
  error_type: EnqueueEditImageErrorType;
  error_message?: string;
}

export interface EnqueueEditImagePayload {
}

export interface EnqueueEditImageSuccess extends CommandResult {
  payload: EnqueueEditImagePayload;
}

export type EnqueueEditImageResult = EnqueueEditImageSuccess | EnqueueEditImageError;

export const EnqueueEditImage = async (request: EnqueueEditImageRequest) : Promise<EnqueueEditImageResult> => {
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

  let mutableRequest : RawEnqueueEditImageRequest = {
    model: modelName,
    prompt: request.prompt,
  };
  
  if (!!request.provider) {
    mutableRequest.provider = request.provider;
  }

  if (!!request.scene_image_media_token) {
    mutableRequest.scene_image_media_token = request.scene_image_media_token;
  }

  if (!!request.image_media_tokens) {
    mutableRequest.image_media_tokens = request.image_media_tokens;
  }

  if (!!request.aspect_ratio) {
    mutableRequest.aspect_ratio = request.aspect_ratio;
  }

  if (!!request.common_aspect_ratio) {
    mutableRequest.common_aspect_ratio = request.common_aspect_ratio;
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

  if (request.horizontal_angle != null) {
    mutableRequest.horizontal_angle = request.horizontal_angle;
  }

  if (request.vertical_angle != null) {
    mutableRequest.vertical_angle = request.vertical_angle;
  }

  if (request.zoom != null) {
    mutableRequest.zoom = request.zoom;
  }

  if (!!request.frontend_caller) {
    mutableRequest.frontend_caller = request.frontend_caller;
  }

  if (!!request.frontend_subscriber_id) {
    mutableRequest.frontend_subscriber_id = request.frontend_subscriber_id;
  }

  const result = await invoke("enqueue_edit_image_command", { 
    request: mutableRequest,
  });
  
  return (result as EnqueueEditImageResult);
}
