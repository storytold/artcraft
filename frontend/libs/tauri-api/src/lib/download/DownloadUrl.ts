import { invoke } from "@tauri-apps/api/core";
import { CommandResult } from "../common/CommandStatus";

export interface DownloadUrlSuccess extends CommandResult {
  payload: DownloadUrlPayload;
}

export interface DownloadUrlPayload {
}

export interface DownloadOptions {
  model?: string;
  batch_index?: number;
  directory?: string;
}

export const GetDownloadPath = (url: string, options: DownloadOptions = {}): Promise<{ filename: string; path: string }> =>
  invoke("get_download_path_command", { request: { url, ...options } });

export const DownloadUrl = async (url: string, options: DownloadOptions = {}) : Promise<DownloadUrlSuccess> => {
  try {
    return await invoke("download_url_command", {
      request: {
        url,
        ...options,
      }
    }) as DownloadUrlSuccess;
  } catch (error) {
    throw error;
  }
}
