import { invoke } from "@tauri-apps/api/core";
import { CommandResult } from "../common/CommandStatus";

export const SetFalApiKey = async (key: string) : Promise<CommandResult> => {
  let result = await invoke("set_fal_api_key_command", {
    request: {
      key: key,
    }
  });
  return (result as CommandResult);
}
