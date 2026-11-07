import { invoke } from "@tauri-apps/api/core";
import { CommandResult } from "../common/CommandStatus";

// NB: Mirrors `ProviderCredentialKey` in Rust (provider_credential_key.rs).
export enum ProviderCredentialKey {
  FalApiKey = "fal_api_key",
  OpenRouterApiKey = "open_router_api_key",
  ReplicateApiKey = "replicate_api_key",
  GrokWebLogin = "grok_web_login",
  HiggsfieldWebLogin = "higgsfield_web_login",
  MidjourneyLogin = "midjourney_login",
  RunwayWebLogin = "runway_web_login",
}

export interface ProviderCredentialDetails {
  // API keys: the first few characters, then asterisks.
  maybe_key_start?: string | null;
  maybe_email_address?: string | null;
  maybe_username?: string | null;
}

export interface ProviderCredentialEntry {
  provider_credential: ProviderCredentialKey | string;
  credential_type: "api_key" | "web_login";
  has_credentials: boolean;
  maybe_details?: ProviderCredentialDetails | null;
}

export interface ListProviderCredentialsSuccessResult extends CommandResult {
  payload: {
    providers: ProviderCredentialEntry[];
  };
}

export const ListProviderCredentials = async (): Promise<
  ListProviderCredentialsSuccessResult | CommandResult
> => {
  const result = await invoke("provider_list_command");
  return result as ListProviderCredentialsSuccessResult | CommandResult;
};

/** The saved credential for `key`, if any. */
export const GetProviderCredential = async (
  key: ProviderCredentialKey,
): Promise<ProviderCredentialEntry | undefined> => {
  const result = await ListProviderCredentials();
  if (!("payload" in result)) {
    return undefined;
  }
  return result.payload.providers.find(
    (entry) => entry.provider_credential === key && entry.has_credentials,
  );
};

export const SetProviderApiKey = async (
  key: ProviderCredentialKey,
  apiKey: string,
): Promise<CommandResult> => {
  const result = await invoke("provider_set_api_key_command", {
    request: {
      provider_credential: key,
      api_key: apiKey.trim(),
    },
  });
  return result as CommandResult;
};

export const ClearProviderCredential = async (
  key: ProviderCredentialKey,
): Promise<CommandResult> => {
  const result = await invoke("provider_clear_command", {
    request: {
      provider_credential: key,
    },
  });
  return result as CommandResult;
};
