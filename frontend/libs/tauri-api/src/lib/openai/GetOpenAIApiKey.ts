import { invoke } from "@tauri-apps/api/core";
import { CommandResult } from "../common/CommandStatus";

export interface GetOpenAIApiKeySuccessResult extends CommandResult {
  payload: {
    key: string;
  };
}

export type GetOpenAIApiKeyResult = GetOpenAIApiKeySuccessResult | CommandResult;

export const GetOpenAIApiKey = async (): Promise<GetOpenAIApiKeyResult> => {
  const result = await invoke("get_openai_api_key_command");
  return result as GetOpenAIApiKeyResult;
};
