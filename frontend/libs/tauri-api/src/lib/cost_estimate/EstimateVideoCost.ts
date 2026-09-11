import { invoke } from "@tauri-apps/api/core";
import { CommandResult, CommandSuccessStatus } from "../common/CommandStatus";
import {
  GenerationMode,
  GenerationProvider,
} from "@storyteller/api-enums";

export interface EstimateVideoCostRequest {
  [key: string]: unknown;
  model: string;
  provider?: GenerationProvider;
  generation_mode?: GenerationMode;
  aspect_ratio?: string;
  resolution?: string;
  duration_seconds?: number;
  video_batch_count?: number;
  generate_audio?: boolean;
  bitrate?: string;
  start_frame_image_media_token?: string;
  end_frame_image_media_token?: string;
  reference_image_media_tokens?: string[];
  reference_video_media_tokens?: string[];
  reference_audio_media_tokens?: string[];
  estimate_only?: {
    total_input_video_duration_millis?: number;
    total_input_audio_duration_millis?: number;
  };
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
