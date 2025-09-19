import { invoke } from "@tauri-apps/api/core";
import { CommandResult } from "../common/CommandStatus";
import { Provider } from "./Provider";

export interface GetProviderOrderSuccess extends CommandResult {
  payload: GetProviderOrderPayload;
}

export interface GetProviderOrderPayload {
  providers: Provider[];
}

// Returns the Success and Error variants directly.
// Throws on Network/Tauri errors.
export const GetProviderOrder = async () : Promise<GetProviderOrderSuccess> => {
  try {
    return await invoke("get_provider_order_command") as GetProviderOrderSuccess;
  } catch (error) {
    // NB: Endpoint should be infalliable
    throw error;
  }
}
