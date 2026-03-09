import { invoke } from "@tauri-apps/api/core";
import { CommandResult } from "../common/CommandStatus";
import { Model } from "@storyteller/model-list";
import { GenerationProvider } from "@storyteller/api-enums";

export enum EnqueueImageToGaussianErrorType {
  /// Caller didn't specify a model
  ModelNotSpecified = "model_not_specified",
  /// Generic server error
  ServerError = "server_error",
  /// No Storyteller creds
  NeedsStorytellerCredentials = "needs_storyteller_credentials",
  /// No provider available
  NoProviderAvailable = "no_provider_available",
}

export interface EnqueueImageToGaussianRequest {
  // Required. The model to use.
  model?: Model;

  // The provider to use.
  provider?: GenerationProvider;

  // Optional. Text prompt to direct the gaussian.
  prompt?: string;

  // Required. Starting frame.
  image_media_tokens?: string[];

  // Optional frontend state to return later.
  frontend_caller?: string;

  // Optional frontend state to return later.
  frontend_subscriber_id?: string;
}

interface RawEnqueueImageToGaussianRequest {
  model?: string;
  provider?: GenerationProvider;
  prompt?: string;
  image_media_tokens?: string[];
  frontend_caller?: string;
  frontend_subscriber_id?: string;
}

export interface EnqueueImageToGaussianError extends CommandResult {
  error_type: EnqueueImageToGaussianErrorType;
  error_message?: string;
}

export type EnqueueImageToGaussianPayload = Record<string, never>;

export interface EnqueueImageToGaussianSuccess extends CommandResult {
  payload: EnqueueImageToGaussianPayload;
}

export type EnqueueImageToGaussianResult =
  | EnqueueImageToGaussianSuccess
  | EnqueueImageToGaussianError;

export const EnqueueImageToGaussian = async (
  request: EnqueueImageToGaussianRequest
): Promise<EnqueueImageToGaussianResult> => {
  const mutableRequest: RawEnqueueImageToGaussianRequest = {
    model: request.model?.tauriId,
    image_media_tokens: request.image_media_tokens,
  };

  if (request.provider) {
    mutableRequest.provider = request.provider;
  }

  if (request.prompt) {
    mutableRequest.prompt = request.prompt;
  }

  if (request.frontend_caller) {
    mutableRequest.frontend_caller = request.frontend_caller;
  }

  if (request.frontend_subscriber_id) {
    mutableRequest.frontend_subscriber_id = request.frontend_subscriber_id;
  }

  const result = await invoke("enqueue_image_to_gaussian_command", {
    request: mutableRequest,
  });

  return result as EnqueueImageToGaussianResult;
};
