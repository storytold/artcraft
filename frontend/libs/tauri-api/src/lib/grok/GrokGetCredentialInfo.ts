import { invoke } from "@tauri-apps/api/core";
import { CommandResult } from "../common/CommandStatus";

export interface GrokGetCredentialInfoPayload {
  maybe_email?: string;
  can_clear_state: boolean;
}

export interface GrokGetCredentialInfoSuccess extends CommandResult {
  payload: GrokGetCredentialInfoPayload;
}

export const GrokGetCredentialInfo = async (): Promise<GrokGetCredentialInfoSuccess> => {
  const result = await invoke("grok_get_credential_info_command");
  return result as GrokGetCredentialInfoSuccess;
};
