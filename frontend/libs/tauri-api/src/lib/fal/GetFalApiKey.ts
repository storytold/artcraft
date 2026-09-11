import { invoke } from "@tauri-apps/api/core";
import { CommandResult } from "../common/CommandStatus";

export interface GetFalApiKeySuccessResult extends CommandResult {
  payload: {
    key: string;
  };
}

export type GetFalApiKeyResult = GetFalApiKeySuccessResult | CommandResult;

export const GetFalApiKey = async (): Promise<GetFalApiKeyResult> => {
  let result = await invoke("get_fal_api_key_command");
  return result as GetFalApiKeyResult;
};
