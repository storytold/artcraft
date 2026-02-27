import { invoke } from "@tauri-apps/api/core";
import { CommandResult } from "../common/CommandStatus";
import { Model } from "@storyteller/model-list";
import { GenerationProvider } from "@storyteller/api-enums";

export enum EnqueueImageToVideoErrorType {
  /// Caller didn't specify a model
  ModelNotSpecified = "model_not_specified",
  /// Generic server error
  ServerError = "server_error",
  /// No Fal API key available
  NeedsFalApiKey = "needs_fal_api_key",
  /// Fal had an API error
  FalError = "fal_error",
}

export interface EnqueueImageToVideoRequest {
  // Required. The model to use.
  model?: Model;

  // The provider to use.
  provider?: GenerationProvider;

  // Required. Starting frame.
  image_media_token?: string;

  // Optional. Ending frame.
  end_frame_image_media_token?: string;

  // Optional. Text prompt to direct the video.
  prompt?: string;

  // Optional frontend state to return later.
  frontend_caller?: string;

  // Optional frontend state to return later.
  frontend_subscriber_id?: string;

  // Optional. Orientation of the video for Sora 2.
  sora_orientation?: "portrait" | "landscape";

  // Optional. Aspect Ratio for the video for Grok Video.
  grok_aspect_ratio?: "portrait" | "landscape" | "square";

  // Optional. Whether to generate audio alongside the video (used by some models like Veo2)
  generate_audio?: boolean;

  // Optional. Common aspect ratio for other models. 
  // Not all are supported by all models, but Artcraft will compensate.
  aspect_ratio?: string; // TODO: Typesafety.

  // Optional. Duration in seconds.
  duration_seconds?: number;

  // Optional. Reference image media tokens (for reference mode).
  reference_image_media_tokens?: string[];
}

interface RawEnqueueImageToVideoRequest {
  model?: string;
  provider?: GenerationProvider;
  image_media_token?: string;
  end_frame_image_media_token?: string;
  prompt?: string;
  frontend_caller?: string;
  frontend_subscriber_id?: string;
  sora_orientation?: "portrait" | "landscape";
  grok_aspect_ratio?: "portrait" | "landscape" | "square";
  generate_audio?: boolean;
  aspect_ratio?: string; // TODO: Typesafety.
  duration_seconds?: number;
  reference_image_media_tokens?: string[];
}

export interface EnqueueImageToVideoError extends CommandResult {
  error_type: EnqueueImageToVideoErrorType;
  error_message?: string;
}

export type EnqueueImageToVideoPayload = Record<string, never>;

export interface EnqueueImageToVideoSuccess extends CommandResult {
  payload: EnqueueImageToVideoPayload;
}

export type EnqueueImageToVideoResult =
  | EnqueueImageToVideoSuccess
  | EnqueueImageToVideoError;

export const EnqueueImageToVideo = async (
  request: EnqueueImageToVideoRequest,
): Promise<EnqueueImageToVideoResult> => {
  const mutableRequest: RawEnqueueImageToVideoRequest = {
    model: request.model?.tauriId,
    image_media_token: request.image_media_token,
  };

  if (request.provider) {
    mutableRequest.provider = request.provider;
  }

  if (request.prompt) {
    mutableRequest.prompt = request.prompt;
  }

  if (request.end_frame_image_media_token) {
    mutableRequest.end_frame_image_media_token =
      request.end_frame_image_media_token;
  }

  if (request.frontend_caller) {
    mutableRequest.frontend_caller = request.frontend_caller;
  }

  if (request.frontend_subscriber_id) {
    mutableRequest.frontend_subscriber_id = request.frontend_subscriber_id;
  }

  if (request.sora_orientation) {
    mutableRequest.sora_orientation = request.sora_orientation;
  }

  if (request.grok_aspect_ratio) {
    mutableRequest.grok_aspect_ratio = request.grok_aspect_ratio;
  }

  if (typeof request.generate_audio === "boolean") {
    mutableRequest.generate_audio = request.generate_audio;
  }

  if (request.aspect_ratio) {
    mutableRequest.aspect_ratio = request.aspect_ratio;
  }

  if (typeof request.duration_seconds === "number") {
    mutableRequest.duration_seconds = request.duration_seconds;
  }

  if (
    request.reference_image_media_tokens &&
    request.reference_image_media_tokens.length > 0
  ) {
    mutableRequest.reference_image_media_tokens =
      request.reference_image_media_tokens;
  }

  const result = await invoke("enqueue_image_to_video_command", {
    request: mutableRequest,
  });

  return result as EnqueueImageToVideoResult;
};
