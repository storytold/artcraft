import { invoke } from "@tauri-apps/api/core";
import { commandErrorMessage } from "../common/commandErrorMessage";
import type { ProviderCredentialKey } from "./ProviderCredentialKey";

// Saves an API key for a provider (stored in the app's credentials folder).
export const ProviderSetApiKey = async (
  providerCredential: ProviderCredentialKey,
  apiKey: string,
): Promise<void> => {
  try {
    await invoke("provider_set_api_key_command", {
      request: { provider_credential: providerCredential, api_key: apiKey },
    });
  } catch (error) {
    throw new Error(commandErrorMessage(error, "Could not save the API key."));
  }
};
