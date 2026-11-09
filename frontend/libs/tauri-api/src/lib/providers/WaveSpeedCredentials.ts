import { invoke } from "@tauri-apps/api/core";
import { CommandResult } from "../common/CommandStatus";

interface ProviderListResult extends CommandResult {
  payload?: {
    providers: { provider_credential: string; has_credentials: boolean }[];
  };
}

export async function HasWaveSpeedApiKey(): Promise<boolean> {
  const result = await invoke<ProviderListResult>("provider_list_command");
  if (result.status !== "success" || !result.payload) {
    throw new Error("Could not load WaveSpeed credentials");
  }
  return result.payload.providers.some(
    (provider) => provider.provider_credential === "wavespeed_api_key" && provider.has_credentials,
  );
}

export async function SetWaveSpeedApiKey(apiKey: string): Promise<void> {
  if (!apiKey.trim()) throw new Error("WaveSpeed API key cannot be empty");
  const result = await invoke<CommandResult>("provider_set_api_key_command", {
    request: { provider_credential: "wavespeed_api_key", api_key: apiKey.trim() },
  });
  if (result.status !== "success") throw new Error("Could not save WaveSpeed API key");
}

export async function ClearWaveSpeedApiKey(): Promise<void> {
  const result = await invoke<CommandResult>("provider_clear_command", {
    request: { provider_credential: "wavespeed_api_key" },
  });
  if (result.status !== "success") throw new Error("Could not remove WaveSpeed API key");
}
