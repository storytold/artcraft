import { invoke } from "@tauri-apps/api/core";
import { CommandResult } from "../common/CommandStatus";

export interface MediaFileDeleteError extends CommandResult {
  error_message?: string;
}

export interface MediaFileDeletePayload {
  success: boolean;
}

export interface MediaFileDeleteSuccess extends CommandResult {
  payload: MediaFileDeletePayload;
}

export type MediaFileDeleteResult = MediaFileDeleteSuccess | MediaFileDeleteError;

export const MediaFileDelete = async (media_file_token: string) : Promise<MediaFileDeleteResult> => {
  const result = await invoke("media_file_delete_command", {
    request: { 
      media_file_token: media_file_token,
    }
  });

  return (result as MediaFileDeleteResult);
}
