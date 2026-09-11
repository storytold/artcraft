import { invoke } from "@tauri-apps/api/core";
import { CommandResult } from "../common/CommandStatus";

export const SetOpenAIApiKey = async (key: string): Promise<CommandResult> => {
  const result = await invoke("set_openai_api_key_command", {
    request: {
      key: key,
    }
  });
  return result as CommandResult;
};
