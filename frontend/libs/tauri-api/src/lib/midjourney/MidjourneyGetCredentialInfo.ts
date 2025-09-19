import { invoke } from "@tauri-apps/api/core";
import { CommandResult } from "../common/CommandStatus";

export interface MidjourneyGetCredentialInfoPayload {
  maybe_email?: string;
  can_clear_state: boolean;
}

export interface MidjourneyGetCredentialInfoSuccess extends CommandResult {
  payload: MidjourneyGetCredentialInfoPayload;
}

export const MidjourneyGetCredentialInfo = async (): Promise<MidjourneyGetCredentialInfoSuccess> => {
  const result = await invoke("midjourney_get_credential_info_command");
  return result as MidjourneyGetCredentialInfoSuccess;
};
