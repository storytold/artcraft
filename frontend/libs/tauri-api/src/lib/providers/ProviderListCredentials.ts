import { invoke } from "@tauri-apps/api/core";
import { CommandResult } from "../common/CommandStatus";
import { commandErrorMessage } from "../common/commandErrorMessage";
import type { ProviderCredentialEntry } from "./ProviderCredentialKey";

interface ProviderListSuccess extends CommandResult {
  payload: { providers: ProviderCredentialEntry[] };
}

// Lists every provider credential slot and whether it is filled.
export const ProviderListCredentials = async (): Promise<
  ProviderCredentialEntry[]
> => {
  try {
    const result = (await invoke("provider_list_command")) as ProviderListSuccess;
    return result.payload.providers;
  } catch (error) {
    throw new Error(
      commandErrorMessage(error, "Could not load your provider keys."),
    );
  }
};
