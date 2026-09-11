import { invoke } from "@tauri-apps/api/core";
import { CommandResult } from "../common/CommandStatus";

export interface WorldLabsGetCredentialInfoPayload {
  maybe_email?: string;
  can_clear_state: boolean;
}

export interface WorldLabsGetCredentialInfoSuccess extends CommandResult {
  payload: WorldLabsGetCredentialInfoPayload;
}

export const WorldLabsGetCredentialInfo = async (): Promise<WorldLabsGetCredentialInfoSuccess> => {
  const result = await invoke("worldlabs_get_credential_info_command");
  return result as WorldLabsGetCredentialInfoSuccess;
};
