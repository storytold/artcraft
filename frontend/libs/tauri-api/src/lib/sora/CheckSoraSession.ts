import { invoke } from "@tauri-apps/api/core";

export interface CheckSoraSessionResult {
  state: SoraSessionState;
  maybe_account_email?: string;
}

export enum SoraSessionState {
  NotSetUp = "not_set_up",
  ExpiredOrError = "expired_or_error",
  Valid = "valid",
}

export const CheckSoraSession = async (): Promise<CheckSoraSessionResult> => {
  const result = await invoke("check_sora_session_command");
  console.log(">>> sora result", result);
  return result as CheckSoraSessionResult;
};
