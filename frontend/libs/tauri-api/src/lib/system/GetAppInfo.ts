import { invoke } from "@tauri-apps/api/core";
import { CommandResult } from "../common/CommandStatus";

export interface GetAppInfoSuccess extends CommandResult {
  payload: GetAppInfoPayload;
}

export interface GetAppInfoPayload {
  artcraft_version: string;
  build_timestamp: string;
  git_commit_id?: string | null;
  git_commit_short_id?: string | null;
  git_commit_timestamp?: string | null;
  storyteller_host?: string | null;
  os_platform?: string | null;
  os_version?: string | null;
}

// Returns the Success and Error variants directly.
// Throws on Network/Tauri errors.
export const GetAppInfo = async () : Promise<GetAppInfoSuccess> => {
  try {
    return await invoke("get_app_info_command") as GetAppInfoSuccess;
  } catch (error) {
    // NB: Endpoint should be infalliable
    throw error;
  }
}
