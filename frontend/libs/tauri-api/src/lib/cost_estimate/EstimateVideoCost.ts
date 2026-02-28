import { invoke } from "@tauri-apps/api/core";
import { CommandResult, CommandSuccessStatus } from "../common/CommandStatus";
import {
  CommonVideoModel,
  CommonAspectRatio,
  CommonVideoResolution,
  GenerationMode,
  GenerationProvider,
} from "@storyteller/api-enums";

export interface EstimateVideoCostRequest {
  model: CommonVideoModel;
  provider: GenerationProvider;
  generation_mode: GenerationMode;
  aspect_ratio?: CommonAspectRatio;
  resolution?: CommonVideoResolution;
  duration_seconds?: number;
  video_batch_count?: number;
}

export interface EstimateVideoCostPayload {
  success: boolean;
  cost_in_credits?: number;
  cost_in_usd_cents?: number;
  is_free: boolean;
  is_unlimited: boolean;
  is_rate_limited: boolean;
  has_watermark: boolean;
}

export interface EstimateVideoCostSuccess extends CommandResult {
  payload: EstimateVideoCostPayload;
}

export interface EstimateVideoCostErrorPayload {
  success: boolean;
  error_type: "invalid_provider_for_model" | "invalid_input";
  error_message: string;
}

export interface EstimateVideoCostErrorResult extends CommandResult {
  error_details?: EstimateVideoCostErrorPayload;
}

export type EstimateVideoCostResult =
  | EstimateVideoCostSuccess
  | EstimateVideoCostErrorResult;

export const EstimateVideoCost = async (
  request: EstimateVideoCostRequest,
): Promise<EstimateVideoCostResult> => {
  const result = await invoke("estimate_video_cost_command", { request });
  return result as EstimateVideoCostResult;
};

export function isEstimateVideoCostSuccess(
  r: EstimateVideoCostResult,
): r is EstimateVideoCostSuccess {
  return r.status === CommandSuccessStatus.Success;
}
