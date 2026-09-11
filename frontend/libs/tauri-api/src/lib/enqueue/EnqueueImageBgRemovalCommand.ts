import { invoke } from "@tauri-apps/api/core";
import { CommandResult } from "../common/CommandStatus";

export interface EnqueueImageBgRemovalRequest {
  image_media_token?: string;
  base64_image?: string;

  // TODO: Actual enum.
  frontend_caller?: string;

  // We'll use the node id here.
  frontend_subscriber_id?: string;
}

interface RawEnqueueImageBgRemovalRequest {
  image_media_token?: string;
  base64_image?: string;
  frontend_caller?: string;
  frontend_subscriber_id?: string;
}

export enum EnqueueImageBgRemovalErrorType {
  /// Caller didn't specify a model
  ModelNotSpecified = "model_not_specified",
  /// Generic server error
  ServerError = "server_error",
  /// No Fal API key available
  NeedsFalApiKey = "needs_fal_api_key",
  /// Fal had an API error
  FalError = "fal_error",
}

export interface EnqueueImageBgRemovalError extends CommandResult {
  error_type: EnqueueImageBgRemovalErrorType;
  error_message?: string;
}

export interface EnqueueImageBgRemovalPayload {
}

export interface EnqueueImageBgRemovalSuccess extends CommandResult {
  payload: EnqueueImageBgRemovalPayload;
}

export type EnqueueImageBgRemovalResult = EnqueueImageBgRemovalSuccess | EnqueueImageBgRemovalError;

export const EnqueueImageBgRemoval = async (request: EnqueueImageBgRemovalRequest) : Promise<EnqueueImageBgRemovalResult> => {
  let mutableRequest : RawEnqueueImageBgRemovalRequest = {};

  if (!!request.image_media_token) {
    mutableRequest.image_media_token = request.image_media_token;
  }

  if (!!request.base64_image) {
    mutableRequest.base64_image = request.base64_image;
  }

  if (!!request.frontend_caller) {
    mutableRequest.frontend_caller = request.frontend_caller;
  }

  if (!!request.frontend_subscriber_id) {
    mutableRequest.frontend_subscriber_id = request.frontend_subscriber_id;
  }

  const result = await invoke("enqueue_image_bg_removal_command", { 
    request: mutableRequest,
  });

  return (result as EnqueueImageBgRemovalResult);
}
