import { ApiManager } from "./ApiManager.js";

// ── Shared enums (match backend) ─────────────────────────────────────────

// These are the string values the omni-gen API accepts/returns.
// They align with CommonAspectRatio and CommonResolution on the frontend.

// ── Image request / response types ───────────────────────────────────────

export interface OmniGenImageRequest {
  model: string;
  prompt?: string | null;
  idempotency_token?: string | null;
  aspect_ratio?: string | null;
  resolution?: string | null;
  quality?: string | null;
  image_batch_count?: number | null;
  image_media_tokens?: string[] | null;
  horizontal_angle?: number | null;
  vertical_angle?: number | null;
  zoom?: number | null;
}

export interface OmniGenImageCostResponse {
  success: boolean;
  cost_in_credits?: number | null;
  cost_in_usd_cents?: number | null;
  has_watermark: boolean;
  is_free: boolean;
  is_rate_limited: boolean;
  is_unlimited: boolean;
}

export interface OmniGenImageGenerateResponse {
  success: boolean;
  inference_job_token: string;
}

// ── Video request / response types ───────────────────────────────────────

export interface OmniGenVideoRequest {
  model: string;
  prompt?: string | null;
  idempotency_token?: string | null;
  aspect_ratio?: string | null;
  resolution?: string | null;
  quality?: string | null;
  duration_seconds?: number | null;
  video_batch_count?: number | null;
  generate_audio?: boolean | null;
  start_frame_image_media_token?: string | null;
  end_frame_image_media_token?: string | null;
  reference_image_media_tokens?: string[] | null;
  reference_video_media_tokens?: string[] | null;
  reference_audio_media_tokens?: string[] | null;
  negative_prompt?: string | null;
}

export interface OmniGenVideoCostResponse {
  success: boolean;
  cost_in_credits?: number | null;
  cost_in_usd_cents?: number | null;
  has_watermark: boolean;
  is_free: boolean;
  is_rate_limited: boolean;
  is_unlimited: boolean;
}

export interface OmniGenVideoGenerateResponse {
  success: boolean;
  inference_job_token: string;
}

// ── Image model info (from GET /v1/omni_gen/models/image) ────────────────

export interface OmniGenImageModelInfo {
  model: string;
  full_name: string | null;
  aspect_ratio_options: string[] | null;
  aspect_ratio_default: string | null;
  aspect_ratio_default_when_editing: string | null;
  resolution_options: string[] | null;
  resolution_default: string | null;
  batch_size_options: number[] | null;
  batch_size_default: number | null;
  batch_size_min: number | null;
  batch_size_max: number | null;
  quality_options: string[] | null;
  default_quality: string | null;
  image_refs_supported: boolean | null;
  image_refs_max: number | null;
  has_fixed_editing_aspect_ratio: boolean | null;
  text_prompt_supported: boolean | null;
  text_prompt_max_length: number | null;
  negative_text_prompt_supported: boolean | null;
  negative_text_prompt_max_length: number | null;
}

export interface OmniGenImageModelsResponse {
  success: boolean;
  models: OmniGenImageModelInfo[];
  providers: OmniGenProviderEntry[];
}

// ── Video model info (from GET /v1/omni_gen/models/video) ────────────────

export interface OmniGenVideoModelInfo {
  model: string;
  full_name: string | null;
  aspect_ratio_options: string[] | null;
  aspect_ratio_default: string | null;
  resolution_options: string[] | null;
  resolution_default: string | null;
  batch_size_options: number[] | null;
  batch_size_default: number | null;
  batch_size_min: number | null;
  batch_size_max: number | null;
  quality_options: string[] | null;
  default_quality: string | null;
  duration_seconds_options: number[] | null;
  duration_seconds_default: number | null;
  duration_seconds_min: number | null;
  duration_seconds_max: number | null;
  starting_keyframe_supported: boolean | null;
  starting_keyframe_required: boolean | null;
  ending_keyframe_supported: boolean | null;
  show_generate_with_sound_toggle: boolean | null;
  image_references_supported: boolean | null;
  image_references_max: number | null;
  video_references_supported: boolean | null;
  video_references_max: number | null;
  video_references_max_total_duration_seconds: number | null;
  audio_references_supported: boolean | null;
  audio_references_max: number | null;
  audio_references_max_total_duration_seconds: number | null;
  text_prompt_supported: boolean | null;
  text_prompt_max_length: number | null;
  negative_text_prompt_supported: boolean | null;
  negative_text_prompt_max_length: number | null;
}

export interface OmniGenVideoModelsResponse {
  success: boolean;
  models: OmniGenVideoModelInfo[];
  providers: OmniGenProviderEntry[];
}

// ── Provider types (shared by image and video model responses) ───────────

export interface OmniGenProviderModelEntry {
  model: string;
  overrides: Record<string, unknown> | null;
}

export interface OmniGenProviderEntry {
  provider: string;
  models: OmniGenProviderModelEntry[];
}

// ── Helpers ──────────────────────────────────────────────────────────────

/** Strip keys whose value is null or undefined so the server only sees
 *  fields that are explicitly set. */
function stripNulls(obj: object): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v != null),
  );
}

// ── API class ────────────────────────────────────────────────────────────

export class OmniGenApi extends ApiManager {
  // ── Models ───────────────────────────────────────────────────────────

  public async getImageModels(
    provider?: string,
  ): Promise<OmniGenImageModelsResponse> {
    const query = provider ? { provider } : undefined;
    return this.get<OmniGenImageModelsResponse>({
      endpoint: `${this.getApiSchemeAndHost()}/v1/omni_gen/models/image`,
      query,
    });
  }

  public async getVideoModels(
    provider?: string,
  ): Promise<OmniGenVideoModelsResponse> {
    const query = provider ? { provider } : undefined;
    return this.get<OmniGenVideoModelsResponse>({
      endpoint: `${this.getApiSchemeAndHost()}/v1/omni_gen/models/video`,
      query,
    });
  }

  // ── Cost estimates ───────────────────────────────────────────────────

  public async estimateImageCost(
    body: OmniGenImageRequest,
  ): Promise<OmniGenImageCostResponse> {
    return this.post<Record<string, unknown>, OmniGenImageCostResponse>({
      endpoint: `${this.getApiSchemeAndHost()}/v1/omni_gen/cost/image`,
      body: stripNulls(body),
    });
  }

  public async estimateVideoCost(
    body: OmniGenVideoRequest,
  ): Promise<OmniGenVideoCostResponse> {
    return this.post<Record<string, unknown>, OmniGenVideoCostResponse>({
      endpoint: `${this.getApiSchemeAndHost()}/v1/omni_gen/cost/video`,
      body: stripNulls(body),
    });
  }

  // ── Generation ───────────────────────────────────────────────────────

  public async generateImage(
    body: OmniGenImageRequest,
  ): Promise<OmniGenImageGenerateResponse> {
    return this.post<Record<string, unknown>, OmniGenImageGenerateResponse>({
      endpoint: `${this.getApiSchemeAndHost()}/v1/omni_gen/generate/image`,
      body: stripNulls(body),
    });
  }

  public async generateVideo(
    body: OmniGenVideoRequest,
  ): Promise<OmniGenVideoGenerateResponse> {
    return this.post<Record<string, unknown>, OmniGenVideoGenerateResponse>({
      endpoint: `${this.getApiSchemeAndHost()}/v1/omni_gen/generate/video`,
      body: stripNulls(body),
    });
  }
}
