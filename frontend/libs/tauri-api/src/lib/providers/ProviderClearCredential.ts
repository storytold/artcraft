import { invoke } from "@tauri-apps/api/core";
import { commandErrorMessage } from "../common/commandErrorMessage";
import type { ProviderCredentialKey } from "./ProviderCredentialKey";

// Removes a saved provider credential.
export const ProviderClearCredential = async (
  providerCredential: ProviderCredentialKey,
): Promise<void> => {
  try {
    await invoke("provider_clear_command", {
      request: { provider_credential: providerCredential },
    });
  } catch (error) {
    throw new Error(
      commandErrorMessage(error, "Could not remove the credential."),
    );
  }
};
