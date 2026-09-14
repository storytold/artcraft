
import { invoke } from "@tauri-apps/api/core";
import { PreferredDownloadDirectory, PreferredDownloadFilename } from "./GetAppPreferences";

export interface UpdateAppPreferencesRequest {
  preference: PreferenceName,
  value: undefined | string | boolean | PreferredDownloadDirectory | PreferredDownloadFilename,
}

export enum PreferenceName {
  PreferredDownloadDirectory = "preferred_download_directory",
  PreferredDownloadFilename = "preferred_download_filename",
  AutoDownload = "auto_download",
  PlaySounds = "play_sounds", 
  DeleteFileSound = "delete_file_sound",
  EnqueueSuccessSound = "enqueue_success_sound",
  EnqueueFailureSound = "enqueue_failure_sound",
  GenerationSuccessSound = "generation_success_sound",
  GenerationFailureSound = "generation_failure_sound",
  GenerationEnqueueSound = "generation_enqueue_sound",
}

export interface UpdateAppPreferencesResult {
  success: boolean
}

export const UpdateAppPreferences = async (request: UpdateAppPreferencesRequest) : Promise<UpdateAppPreferencesResult> => {
  let result = await invoke("update_app_preferences_command", { 
    request: {
      preference: request.preference,
      value: request.value,
    }
  });
  return (result as UpdateAppPreferencesResult);
}
