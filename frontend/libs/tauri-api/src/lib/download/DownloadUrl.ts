import { invoke } from "@tauri-apps/api/core";
import { CommandResult } from "../common/CommandStatus";

export interface DownloadUrlSuccess extends CommandResult {
  payload: DownloadUrlPayload;
}

export interface DownloadUrlPayload {
}

export const DownloadUrl = async (url: string) : Promise<DownloadUrlSuccess> => {
  try {
    return await invoke("download_url_command", {
      request: {
        url: url
      }
    }) as DownloadUrlSuccess;
  } catch (error) {
    throw error;
  }
}
