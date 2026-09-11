import { invoke } from "@tauri-apps/api/core";
import { CommandResult, CommandSuccessStatus } from "../common/CommandStatus";
import { GenerationProvider } from "@storyteller/api-enums";

// Matches Rust CommonSplatModel enum (snake_case serde)
export type CommonSplatModel = "marble_0p1_mini" | "marble_0p1_plus";

export interface EstimateSplatCostRequest {
  model: string;
  provider: GenerationProvider;
  has_reference_image?: boolean;
  reference_image_media_tokens?: string[];
  reference_video_media_token?: string;
  [key: string]: unknown;
}

export interface EstimateSplatCostPayload {
  success: boolean;
  cost_in_credits?: number;
  cost_in_usd_cents?: number;
  is_free: boolean;
  is_unlimited: boolean;
  is_rate_limited: boolean;
  has_watermark: boolean;
}

export interface EstimateSplatCostSuccess extends CommandResult {
  payload: EstimateSplatCostPayload;
}

export interface EstimateSplatCostErrorPayload {
  success: boolean;
  error_type: "invalid_provider_for_model" | "invalid_input";
  error_message: string;
}

export interface EstimateSplatCostErrorResult extends CommandResult {
  error_details?: EstimateSplatCostErrorPayload;
}

export type EstimateSplatCostResult =
  | EstimateSplatCostSuccess
  | EstimateSplatCostErrorResult;

export const EstimateSplatCost = async (
  request: EstimateSplatCostRequest,
): Promise<EstimateSplatCostResult> => {
  const result = await invoke("estimate_splat_cost_command", { request });
  return result as EstimateSplatCostResult;
};

export function isEstimateSplatCostSuccess(
  r: EstimateSplatCostResult,
): r is EstimateSplatCostSuccess {
  return r.status === CommandSuccessStatus.Success;
}
