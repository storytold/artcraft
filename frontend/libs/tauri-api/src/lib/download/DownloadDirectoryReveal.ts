import { invoke } from "@tauri-apps/api/core";
import { CommandResult } from "../common/CommandStatus";

export interface DownloadDirectoryRevealSuccess extends CommandResult {
  payload: DownloadDirectoryRevealPayload;
}

export interface DownloadDirectoryRevealPayload {
}

export const DownloadDirectoryReveal = async () : Promise<DownloadDirectoryRevealSuccess> => {
  try {
    return await invoke("download_directory_reveal_command") as DownloadDirectoryRevealSuccess;
  } catch (error) {
    throw error;
  }
}
