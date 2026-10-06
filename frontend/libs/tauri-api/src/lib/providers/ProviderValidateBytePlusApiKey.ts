import { invoke } from "@tauri-apps/api/core";
import { CommandResult } from "../common/CommandStatus";
import { commandErrorMessage } from "../common/commandErrorMessage";

export type ApiKeyValidationOutcome = "valid" | "invalid" | "unverified";

export interface ApiKeyValidationResult {
  outcome: ApiKeyValidationOutcome;
  maybe_message?: string | null;
}

interface ProviderValidateSuccess extends CommandResult {
  payload: ApiKeyValidationResult;
}

// Checks a BytePlus API key with a free, read-only ModelArk call. "unverified" means the check
// couldn't run (e.g. offline), not that the key is bad.
export const ProviderValidateBytePlusApiKey = async (
  apiKey: string,
): Promise<ApiKeyValidationResult> => {
  try {
    const result = (await invoke("provider_validate_byteplus_api_key_command", {
      request: { api_key: apiKey },
    })) as ProviderValidateSuccess;
    return result.payload;
  } catch (error) {
    throw new Error(
      commandErrorMessage(error, "Could not check the API key."),
    );
  }
};
