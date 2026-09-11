import { invoke } from "@tauri-apps/api/core";
import { CommandResult } from "../common/CommandStatus";

export enum FalHunyuanImageTo3dErrorType {
  ServerError = "server_error",
  NeedsFalApiKey = "needs_fal_api_key",
}

export interface FalHunyuanImageTo3dRequest {
  image_media_token?: string;
  base64_image?: string;
}

export interface FalHunyuanImageTo3dError extends CommandResult {
  error_type: FalHunyuanImageTo3dErrorType;
  error_message?: string;
}

export interface FalHunyuanImageTo3dPayload {
  media_token: string;
  cdn_url: string;
  base64_bytes: string;
}

export interface FalHunyuanImageTo3dSuccess extends CommandResult {
  payload: FalHunyuanImageTo3dPayload;
}

export type FalHunyuanImageTo3dResult = FalHunyuanImageTo3dSuccess | FalHunyuanImageTo3dError;

export const FalHunyuanImageTo3d = async (request: FalHunyuanImageTo3dRequest) : Promise<FalHunyuanImageTo3dResult> => {
  let result = await invoke("fal_hunyuan_image_to_3d_command", { 
    request: {
      image_media_token: request.image_media_token,
      base64_image: request.base64_image,
    }
  });
  return (result as FalHunyuanImageTo3dResult);
}
