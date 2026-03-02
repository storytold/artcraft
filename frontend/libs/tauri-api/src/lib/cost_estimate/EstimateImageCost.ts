import { invoke } from "@tauri-apps/api/core";
import { CommandResult, CommandSuccessStatus } from "../common/CommandStatus";
import {
  CommonImageModel,
  CommonAspectRatio,
  CommonVideoResolution,
  ImageGenerationMode,
  GenerationProvider,
} from "@storyteller/api-enums";

export interface EstimateImageCostRequest {
  model: CommonImageModel;
  provider: GenerationProvider;
  generation_mode: ImageGenerationMode;
  aspect_ratio?: CommonAspectRatio;
  resolution?: CommonVideoResolution;
  image_batch_count?: number;
}

export interface EstimateImageCostPayload {
  success: boolean;
  cost_in_credits?: number;
  cost_in_usd_cents?: number;
  is_free: boolean;
  is_unlimited: boolean;
  is_rate_limited: boolean;
  has_watermark: boolean;
}

export interface EstimateImageCostSuccess extends CommandResult {
  payload: EstimateImageCostPayload;
}

export interface EstimateImageCostErrorPayload {
  success: boolean;
  error_type: "invalid_provider_for_model" | "invalid_input";
  error_message: string;
}

export interface EstimateImageCostErrorResult extends CommandResult {
  error_details?: EstimateImageCostErrorPayload;
}

export type EstimateImageCostResult =
  | EstimateImageCostSuccess
  | EstimateImageCostErrorResult;

export const EstimateImageCost = async (
  request: EstimateImageCostRequest,
): Promise<EstimateImageCostResult> => {
  const result = await invoke("estimate_image_cost_command", { request });
  return result as EstimateImageCostResult;
};

export function isEstimateImageCostSuccess(
  r: EstimateImageCostResult,
): r is EstimateImageCostSuccess {
  return r.status === CommandSuccessStatus.Success;
}
