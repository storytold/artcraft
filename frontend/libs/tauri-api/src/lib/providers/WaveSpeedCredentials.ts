import { invoke } from "@tauri-apps/api/core";
import { CommandResult } from "../common/CommandStatus";

interface ProviderListResult extends CommandResult {
  payload?: {
    providers: { provider_credential: string; has_credentials: boolean }[];
  };
}

/** Query credential availability without exposing the saved key; reject native listing failures. */
export async function HasWaveSpeedApiKey(): Promise<boolean> {
  const result = await invoke<ProviderListResult>("provider_list_command");
  if (result.status !== "success" || !result.payload) {
    throw new Error("Could not load WaveSpeed credentials");
  }
  return result.payload.providers.some(
    (provider) => provider.provider_credential === "wavespeed_api_key" && provider.has_credentials,
  );
}

/** Reject blank keys and persist the trimmed key through the native secure credential command. */
export async function SetWaveSpeedApiKey(apiKey: string): Promise<void> {
  if (!apiKey.trim()) throw new Error("WaveSpeed API key cannot be empty");
  const result = await invoke<CommandResult>("provider_set_api_key_command", {
    request: { provider_credential: "wavespeed_api_key", api_key: apiKey.trim() },
  });
  if (result.status !== "success") throw new Error("Could not save WaveSpeed API key");
}

/** Remove the saved WaveSpeed credential and reject unsuccessful native responses. */
export async function ClearWaveSpeedApiKey(): Promise<void> {
  const result = await invoke<CommandResult>("provider_clear_command", {
    request: { provider_credential: "wavespeed_api_key" },
  });
  if (result.status !== "success") throw new Error("Could not remove WaveSpeed API key");
}
