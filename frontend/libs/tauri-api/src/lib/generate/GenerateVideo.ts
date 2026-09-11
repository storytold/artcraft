import { invoke } from "@tauri-apps/api/core";
import { CommandResult } from "../common/CommandStatus";
import {
  CommonAspectRatio,
  CommonResolution,
  VideoModel,
} from "@storyteller/model-list";
import { GenerationProvider } from "@storyteller/api-enums";

export interface GenerateVideoRequest {
  // API-owned options may be introduced independently of this desktop build.
  [key: string]: unknown;
  // The provider to use (defaults to Artcraft/Storyteller).
  provider?: GenerationProvider;

  // The model to use.
  model?: VideoModel | string;

  // Text prompt.
  prompt?: string;

  // Negative prompt.
  negative_prompt?: string;

  // Starting frame.
  start_frame_image_media_token?: string;

  // Ending frame.
  end_frame_image_media_token?: string;

  // Reference media tokens.
  reference_image_media_tokens?: string[];
  reference_video_media_tokens?: string[];
  reference_audio_media_tokens?: string[];
  reference_character_tokens?: string[];

  aspect_ratio?: CommonAspectRatio | string;
  resolution?: CommonResolution | string;

  bitrate?: string;
  duration_seconds?: number;
  generate_audio?: boolean;
  video_batch_count?: number;

  // Deprecated on the Rust side (still read by some legacy handlers).
  sora_orientation?: "portrait" | "landscape";
  grok_aspect_ratio?: "portrait" | "landscape" | "square";

  // Frontend metadata.
  frontend_caller?: string;
  frontend_subscriber_id?: string;
  frontend_subscriber_payload?: string;
}

export enum GenerateVideoErrorType {
  ModelNotSpecified = "model_not_specified",
  NoProviderAvailable = "no_provider_available",
  ServerError = "server_error",
  NeedsFalApiKey = "needs_fal_api_key",
  FalError = "fal_error",
  NeedsStorytellerCredentials = "needs_storyteller_credentials",
}

export interface GenerateVideoError extends CommandResult {
  error_type: GenerateVideoErrorType;
  error_message?: string;
}

export type GenerateVideoPayload = Record<string, never>;

export interface GenerateVideoSuccess extends CommandResult {
  payload: GenerateVideoPayload;
}

export type GenerateVideoResult = GenerateVideoSuccess | GenerateVideoError;

export const GenerateVideo = async (
  request: GenerateVideoRequest,
): Promise<GenerateVideoResult> => {
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

  const result = await invoke("generate_video_command", {
    request: mutableRequest,
  });

  return result as GenerateVideoResult;
};
