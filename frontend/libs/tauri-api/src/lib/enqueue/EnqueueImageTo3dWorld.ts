import { invoke } from "@tauri-apps/api/core";
import { CommandResult } from "../common/CommandStatus";

export enum EnqueueImageTo3dWorldErrorType {
  ModelNotSpecified = "model_not_specified",
  ServerError = "server_error",
  NeedsFalApiKey = "needs_fal_api_key",
  FalError = "fal_error",
  NeedsStorytellerCredentials = "needs_storyteller_credentials",
}

export interface EnqueueImageTo3dWorldRequest {
  image_media_token?: string;
  model?: EnqueueImageTo3dWorldModel;
  frontend_caller?: string;
  frontend_subscriber_id?: string;
}

interface EnqueueImageTo3dWorldRequestRaw {
  image_media_token?: string;
  model?: EnqueueImageTo3dWorldModel;
  frontend_caller?: string;
  frontend_subscriber_id?: string;
}

export enum EnqueueImageTo3dWorldModel {
  Hunyuan3d2 = "hunyuan_3d_2",
  Hunyuan3d2_0 = "hunyuan_3d_2_0",
  Hunyuan3d2_1 = "hunyuan_3d_2_1",
}

export interface EnqueueImageTo3dWorldError extends CommandResult {
  error_type: EnqueueImageTo3dWorldErrorType;
  error_message?: string;
}

export interface EnqueueImageTo3dWorldPayload {}

export interface EnqueueImageTo3dWorldSuccess extends CommandResult {
  payload: EnqueueImageTo3dWorldPayload;
}

export type EnqueueImageTo3dWorldResult =
  | EnqueueImageTo3dWorldSuccess
  | EnqueueImageTo3dWorldError;

export const EnqueueImageTo3dWorld = async (
  request: EnqueueImageTo3dWorldRequest
): Promise<EnqueueImageTo3dWorldResult> => {
  let mutableRequest: EnqueueImageTo3dWorldRequestRaw = {
    image_media_token: request.image_media_token,
    model: request.model,
  };

  if (!!request.frontend_caller) {
    mutableRequest.frontend_caller = request.frontend_caller;
  }

  if (!!request.frontend_subscriber_id) {
    mutableRequest.frontend_subscriber_id = request.frontend_subscriber_id;
  }

  let result = await invoke("enqueue_image_to_3d_world_command", {
    request: mutableRequest,
  });

  return result as EnqueueImageTo3dWorldResult;
};

