import { invoke } from "@tauri-apps/api/core";
import { CommandResult } from "../common/CommandStatus";
import { Model } from "@storyteller/model-list";

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

  // Optional. Whether to generate audio alongside the video (used by some models like Veo2)
  generate_with_sound?: boolean;
}

interface RawEnqueueImageToVideoRequest {
  model?: string;
  image_media_token?: string;
  end_frame_image_media_token?: string;
  prompt?: string;
  frontend_caller?: string;
  frontend_subscriber_id?: string;
  sora_orientation?: "portrait" | "landscape";
  generate_with_sound?: boolean;
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
  request: EnqueueImageToVideoRequest
): Promise<EnqueueImageToVideoResult> => {
  const mutableRequest: RawEnqueueImageToVideoRequest = {
    model: request.model?.tauriId,
    image_media_token: request.image_media_token,
  };

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

  if (typeof request.generate_with_sound === "boolean") {
    mutableRequest.generate_with_sound = request.generate_with_sound;
  }

  const result = await invoke("enqueue_image_to_video_command", {
    request: mutableRequest,
  });

  return result as EnqueueImageToVideoResult;
};
