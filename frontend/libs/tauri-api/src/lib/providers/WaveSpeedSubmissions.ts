import { invoke } from "@tauri-apps/api/core";
import { CommandResult } from "../common/CommandStatus";

export interface UncertainWaveSpeedSubmission { id: string; prompt: string; model_id: string; task_type: string }

/** Collect all uncertain-submission pages, rejecting failed commands and non-advancing cursors. */
export async function ListWaveSpeedSubmissions(): Promise<UncertainWaveSpeedSubmission[]> {
  const submissions: UncertainWaveSpeedSubmission[] = [];
  let cursor: number | undefined;
  do {
    const result = await invoke<CommandResult & { payload?: { submissions: UncertainWaveSpeedSubmission[]; next_cursor?: number | null } }>("list_wavespeed_submissions_command", cursor === undefined ? undefined : { request: { cursor } });
    if (result.status !== "success") throw new Error("Could not load WaveSpeed submission recovery");
    submissions.push(...(result.payload?.submissions ?? []));
    const next = result.payload?.next_cursor;
    if (next == null) return submissions;
    if (next <= (cursor ?? 0)) throw new Error("Invalid submission cursor");
    cursor = next;
  } while (cursor !== undefined);
  return submissions;
}

/** Attach a trimmed existing prediction ID to a local receipt without creating another provider prediction. */
export async function RecoverWaveSpeedSubmission(id: string, predictionId: string): Promise<void> {
  const result = await invoke<CommandResult & { error_message?: string }>("recover_wavespeed_submission_command", { request: { id, prediction_id: predictionId.trim() } });
  if (result.status !== "success") throw new Error(result.error_message ?? "Could not recover the WaveSpeed prediction");
}
