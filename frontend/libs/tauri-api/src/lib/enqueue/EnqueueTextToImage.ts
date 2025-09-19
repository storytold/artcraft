import { invoke } from "@tauri-apps/api/core";
import { CommandResult } from "../common/CommandStatus";
import { Model } from "@storyteller/model-list";

export enum EnqueueTextToImageErrorType {
  /// Caller didn't specify a model
  ModelNotSpecified = "model_not_specified",
  /// Generic server error
  ServerError = "server_error",
  /// No Fal API key available
  NeedsFalApiKey = "needs_fal_api_key",
  /// Fal had an API error
  FalError = "fal_error",
}

export interface EnqueueTextToImageRequest {
  // The model to use.
  model?: Model | EnqueueTextToImageModel;

  // The text prompt.
  prompt?: string;

  // The desired output aspect ratio.
  aspect_ratio?: EnqueueTextToImageSize;

  // The number of images to generate.
  number_images?: number;

  // Optional image-to-image prompts
  // These are not semantic buckets, but rather just "reference images",
  // and models do not have any further instruction about them. (ie. they 
  // are not "style", "character", etc. references)
  image_media_tokens?: string[];

  // Optional frontend state to return later.
  // TODO: Actual enum.
  frontend_caller?: string;

  // Optional frontend state to return later.
  frontend_subscriber_id?: string;
}

// Shape of request sent to Tauri
// (We do some transformations from the public-facing request object.)
interface EnqueueTextToImageRawRequest {
  prompt?: string;
  model?: EnqueueTextToImageModel | string; // TODO: Shouldn't allow string
  aspect_ratio?: EnqueueTextToImageSize;
  number_images?: number;
  image_media_tokens?: string[];
  frontend_caller?: string;
  frontend_subscriber_id?: string;
}

export enum EnqueueTextToImageModel {
  FluxProUltra = "flux_pro_ultra",
  GptImage1 = "gpt_image_1",
  Recraft3 = "recraft_3",
}

export enum EnqueueTextToImageSize {
  Auto = "auto",
  Square = "square",
  Wide = "wide",
  Tall = "tall",
}

export interface EnqueueTextToImageError extends CommandResult {
  error_type: EnqueueTextToImageErrorType;
  error_message?: string;
}

export interface EnqueueTextToImagePayload {
  media_token: string;
  cdn_url: string;
  base64_bytes: string;
}

export interface EnqueueTextToImageSuccess extends CommandResult {
  payload: EnqueueTextToImagePayload;
}

export type EnqueueTextToImageResult = EnqueueTextToImageSuccess | EnqueueTextToImageError;

export const EnqueueTextToImage = async (request: EnqueueTextToImageRequest) : Promise<EnqueueTextToImageResult> => {
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

  let mutableRequest : EnqueueTextToImageRawRequest = {
    model: modelName,
    prompt: request.prompt,
  };

  if (!!request.aspect_ratio) {
    mutableRequest.aspect_ratio = request.aspect_ratio;
  }

  if (!!request.number_images) {
    mutableRequest.number_images = request.number_images;
  }

  if (!!request.image_media_tokens && request.image_media_tokens.length > 0) {
    mutableRequest.image_media_tokens = request.image_media_tokens;
  }

  if (!!request.frontend_caller) {
    mutableRequest.frontend_caller = request.frontend_caller;
  }

  if (!!request.frontend_subscriber_id) {
    mutableRequest.frontend_subscriber_id = request.frontend_subscriber_id;
  }

  const result = await invoke("enqueue_text_to_image_command", { 
    request: mutableRequest,
  });

  return (result as EnqueueTextToImageResult);
}
