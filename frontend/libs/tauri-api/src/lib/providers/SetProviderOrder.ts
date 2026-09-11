import { invoke } from "@tauri-apps/api/core";
import { CommandResult } from "../common/CommandStatus";
import { Provider } from "./Provider";

export interface SetProviderOrderRequest {
  providers: Provider[];
}

export const SetProviderOrder = async (request: SetProviderOrderRequest) : Promise<CommandResult> => {
  const result = await invoke("set_provider_order_command", { 
    request: {
      providers: request.providers,
    }
  });

  return (result as CommandResult);
}
