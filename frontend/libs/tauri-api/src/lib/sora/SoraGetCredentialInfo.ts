import { invoke } from "@tauri-apps/api/core";
import { CommandResult } from "../common/CommandStatus";

export interface SoraGetCredentialInfoPayload {
  maybe_email?: string;
  can_clear_state: boolean;
}

export interface SoraGetCredentialInfoSuccess extends CommandResult {
  payload: SoraGetCredentialInfoPayload;
}

export const SoraGetCredentialInfo = async (): Promise<SoraGetCredentialInfoSuccess> => {
  const result = await invoke("sora_get_credential_info_command");
  return result as SoraGetCredentialInfoSuccess;
};
