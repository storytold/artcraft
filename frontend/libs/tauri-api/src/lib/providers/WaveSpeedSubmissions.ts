import { invoke } from "@tauri-apps/api/core";
import { CommandResult } from "../common/CommandStatus";

export interface UncertainWaveSpeedSubmission { id: string; prompt: string; model_id: string; task_type: string }

export async function ListWaveSpeedSubmissions(): Promise<UncertainWaveSpeedSubmission[]> {
  const result = await invoke<CommandResult & { payload?: { submissions: UncertainWaveSpeedSubmission[] } }>("list_wavespeed_submissions_command");
  if (result.status !== "success") throw new Error("Could not load WaveSpeed submission recovery");
  return result.payload?.submissions ?? [];
}

export async function RecoverWaveSpeedSubmission(id: string, predictionId: string): Promise<void> {
  const result = await invoke<CommandResult & { error_message?: string }>("recover_wavespeed_submission_command", { request: { id, prediction_id: predictionId.trim() } });
  if (result.status !== "success") throw new Error(result.error_message ?? "Could not recover the WaveSpeed prediction");
}
