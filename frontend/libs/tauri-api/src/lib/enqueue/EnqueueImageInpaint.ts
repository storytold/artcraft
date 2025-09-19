import { invoke } from "@tauri-apps/api/core";
import { CommandResult } from "../common/CommandStatus";
import { ImageModel, ModelInfo } from "@storyteller/model-list";

export interface EnqueueImageInpaintRequest {
  // The model to use.
  model?: ImageModel | ModelInfo | EnqueueImageInpaintModel;

  // The image we're editing.
  image_media_token?: string;

  // The mask to focus the edit (raw bytes).
  mask_image_raw_bytes?: Uint8Array;

  // The user's image generation prompt.
  prompt?: string;

  // Number of images to generate.
  image_count?: number;

  // TODO: Actual enum.
  frontend_caller?: string;

  // Optional frontend state to return later.
  frontend_subscriber_id?: string;
}


// Shape of request sent to Tauri
// (We do some transformations from the public-facing request object.)
interface RawEnqueueImageInpaintRequest {
  model?: EnqueueImageInpaintModel | string;
  image_media_token?: string;
  mask_image_raw_bytes?: Uint8Array;
  prompt?: string;
  image_count?: number;
  frontend_caller?: string;
  frontend_subscriber_id?: string;
}

export enum EnqueueImageInpaintErrorType {
  ModelNotSpecified = "model_not_specified",
  NoProviderAvailable = "no_provider_available",
  BadRequest = "bad_request",
  ServerError = "server_error",
  TooManyConcurrentTasks = "too_many_concurrent_tasks",
  SoraLoginRequired = "sora_login_required",
  SoraUsernameNotYetCreated = "sora_username_not_yet_created",
  SoraIsHavingProblems = "sora_is_having_problems",
}

export enum EnqueueImageInpaintModel {
  FluxPro1 = "flux_pro_1",
  FluxDevJuggernaut = "flux_dev_juggernaut",
}

export interface EnqueueImageInpaintError extends CommandResult {
  error_type: EnqueueImageInpaintErrorType;
  error_message?: string;
}

export interface EnqueueImageInpaintPayload {
}

export interface EnqueueImageInpaintSuccess extends CommandResult {
  payload: EnqueueImageInpaintPayload;
}

export type EnqueueImageInpaintResult = EnqueueImageInpaintSuccess | EnqueueImageInpaintError;

export const EnqueueImageInpaint = async (request: EnqueueImageInpaintRequest) : Promise<EnqueueImageInpaintResult> => {
  let modelName = undefined;

  if (!!request.model) {
    if (typeof request.model === "string") {
      modelName = request.model;
    } else if ("tauriId" in request.model && typeof request.model.tauriId === "string") {
      modelName = request.model.tauriId;
    } else if ("tauri_id" in request.model && typeof request.model.tauri_id === "string") {
      modelName = request.model.tauri_id;
    }
  }

  if (!modelName) {
    throw new Error("No model specified in request: " + JSON.stringify(request));
  }

  let mutableRequest : RawEnqueueImageInpaintRequest = {
    model: modelName,
    prompt: request.prompt,
  };

  if (!!request.image_media_token) {
    mutableRequest.image_media_token = request.image_media_token;
  }

  if (!!request.mask_image_raw_bytes) {
    mutableRequest.mask_image_raw_bytes = request.mask_image_raw_bytes;
  }

  if (!!request.image_count) {
    mutableRequest.image_count = request.image_count;
  }

  if (!!request.frontend_caller) {
    mutableRequest.frontend_caller = request.frontend_caller;
  }

  if (!!request.frontend_subscriber_id) {
    mutableRequest.frontend_subscriber_id = request.frontend_subscriber_id;
  }

  const result = await invoke("enqueue_image_inpaint_command", { 
    request: mutableRequest,
  });
  
  return (result as EnqueueImageInpaintResult);
}
