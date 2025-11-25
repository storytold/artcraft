import { invoke } from "@tauri-apps/api/core";
import { CommandResult } from "../common/CommandStatus";

export enum EnqueueImageTo3dObjectErrorType {
  /// Caller didn't specify a model
  ModelNotSpecified = "model_not_specified",
  /// Generic server error
  ServerError = "server_error",
  /// No Fal API key available
  NeedsFalApiKey = "needs_fal_api_key",
  /// Fal had an API error
  FalError = "fal_error",
  /// Need tobe logged into Artcraft
  NeedsStorytellerCredentials = "needs_storyteller_credentials",
}

export interface EnqueueImageTo3dObjectRequest {
  image_media_token?: string;
  model?: EnqueueImageTo3dObjectModel;

  // TODO: Actual enum.
  frontend_caller?: string;

  // Optional frontend state to return later.
  frontend_subscriber_id?: string;
}

interface EnqueueImageTo3dObjectRequestRaw {
  image_media_token?: string;
  model?: EnqueueImageTo3dObjectModel;
  frontend_caller?: string;
  frontend_subscriber_id?: string;
}

export enum EnqueueImageTo3dObjectModel {
  Hunyuan3d2 = "hunyuan_3d_2",
  Hunyuan3d2_0 = "hunyuan_3d_2_0",
  Hunyuan3d2_1 = "hunyuan_3d_2_1",
}

export interface EnqueueImageTo3dObjectError extends CommandResult {
  error_type: EnqueueImageTo3dObjectErrorType;
  error_message?: string;
}

export interface EnqueueImageTo3dObjectPayload {}

export interface EnqueueImageTo3dObjectSuccess extends CommandResult {
  payload: EnqueueImageTo3dObjectPayload;
}

export type EnqueueImageTo3dObjectResult =
  | EnqueueImageTo3dObjectSuccess
  | EnqueueImageTo3dObjectError;

export const EnqueueImageTo3dObject = async (
  request: EnqueueImageTo3dObjectRequest
): Promise<EnqueueImageTo3dObjectResult> => {
  let mutableRequest: EnqueueImageTo3dObjectRequestRaw = {
    image_media_token: request.image_media_token,
    model: request.model,
  };

  if (!!request.frontend_caller) {
    mutableRequest.frontend_caller = request.frontend_caller;
  }

  if (!!request.frontend_subscriber_id) {
    mutableRequest.frontend_subscriber_id = request.frontend_subscriber_id;
  }

  let result = await invoke("enqueue_image_to_3d_object_command", {
    request: mutableRequest,
  });

  return result as EnqueueImageTo3dObjectResult;
};
