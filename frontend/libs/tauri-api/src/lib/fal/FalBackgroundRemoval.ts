import { invoke } from "@tauri-apps/api/core";
import { CommandResult } from "../common/CommandStatus";

export enum FalBackgroundRemovalErrorType {
  ServerError = "server_error",
  NeedsFalApiKey = "needs_fal_api_key",
}

export interface FalBackgroundRemovalRequest {
  image_media_token?: string;
  base64_image?: string;
}

export interface FalBackgroundRemovalError extends CommandResult {
  error_type: FalBackgroundRemovalErrorType;
  error_message?: string;
}

export interface FalBackgroundRemovalPayload {
  media_token: string;
  cdn_url: string;
  base64_bytes: string;
}

export interface FalBackgroundRemovalSuccess extends CommandResult {
  payload: FalBackgroundRemovalPayload;
}

export type FalBackgroundRemovalResult = FalBackgroundRemovalSuccess | FalBackgroundRemovalError;

export const FalBackgroundRemoval = async (request: FalBackgroundRemovalRequest) : Promise<FalBackgroundRemovalResult> => {
  let result = await invoke("fal_background_removal_command", { 
    request: {
      image_media_token: request.image_media_token,
      base64_image: request.base64_image,
    }
  });
  return (result as FalBackgroundRemovalResult);
}
