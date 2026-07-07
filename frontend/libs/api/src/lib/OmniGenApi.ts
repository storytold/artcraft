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
  bitrate?: string | null;
  duration_seconds?: number | null;
  video_batch_count?: number | null;
  generate_audio?: boolean | null;
  start_frame_image_media_token?: string | null;
  end_frame_image_media_token?: string | null;
  reference_image_media_tokens?: string[] | null;
  reference_video_media_tokens?: string[] | null;
  reference_audio_media_tokens?: string[] | null;
  reference_character_tokens?: string[] | null;
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

// ── Audio request / response types ───────────────────────────────────────

// Audio model ids (match backend CommonAudioModel).
export type OmniGenAudioModelId =
  | "suno_music"
  | "suno_remix"
  | "suno_sounds"
  | "suno_sample"
  | "seed_audio_1p0";

// Musical keys for audio generation (eg. Suno Sounds).
// NB: There are intentionally no E keys, per product spec.
export type OmniGenMusicalKey =
  | "auto"
  | "c_major"
  | "c_minor"
  | "d_major"
  | "d_minor"
  | "f_major"
  | "f_minor"
  | "g_major"
  | "g_minor"
  | "a_major"
  | "a_minor"
  | "b_major"
  | "b_minor";

/** Shared request body for both the audio cost estimate and audio
 *  generation endpoints. */
export interface OmniGenAudioRequest {
  // REQUIRED (even if marked optional) — prevents duplicate requests.
  idempotency_token?: string | null;
  // REQUIRED (even if marked optional) — which model to use.
  model?: OmniGenAudioModelId | string | null;
  prompt?: string | null;
  // Style/genre direction (Suno's "tags").
  style_prompt?: string | null;
  // The remix/sample source, or Seed Audio @Audio references (up to 3).
  audio_media_tokens?: string[] | null;
  // Seed Audio supports a single reference image; cannot be combined with
  // audio references.
  image_media_tokens?: string[] | null;
  // Whether to keep the original lyrics (Suno Remix).
  keep_lyrics?: boolean | null;
  // Whether to generate instrumental-only audio (Suno Music / Sample).
  is_instrumental?: boolean | null;
  // Whether the sound should loop vs a single hit (Suno Sounds).
  is_loopable?: boolean | null;
  // Beats per minute (Suno Sounds).
  bpm?: number | null;
  // The musical key to use (Suno Sounds).
  musical_key?: OmniGenMusicalKey | null;
  // Output sample rate in Hz (Seed Audio: 8000/16000/24000/32000/44100/48000).
  sample_rate_hz?: number | null;
  // Playback speed multiplier (Seed Audio: 0.5–2.0).
  speed?: number | null;
  // Volume multiplier (Seed Audio: 0.5–2.0).
  volume?: number | null;
  // Pitch shift in semitones (Seed Audio: -12..=12).
  pitch?: number | null;
}

export interface OmniGenAudioCostResponse {
  success: boolean;
  cost_in_credits?: number | null;
  cost_in_usd_cents?: number | null;
  // Whether failures are refunded. True: 100% yes. False: 100% no.
  // Null/undefined: unknown or variable.
  failures_are_refunded?: boolean | null;
  has_watermark: boolean;
  is_free: boolean;
  is_rate_limited: boolean;
  is_unlimited: boolean;
}

export interface OmniGenAudioGenerateResponse {
  success: boolean;
  inference_job_token: string;
  // All job tokens created by this request (including the primary). One
  // request may create multiple jobs (eg. Suno multi-clip) — poll them all.
  all_job_tokens: string[];
}

// ── Image model info (from GET /v1/omni_gen/models/image) ────────────────

export interface OmniGenImageModelInfo {
  model: string;
  // ModelCreator enum as a snake_case string, e.g. "bytedance", "google".
  model_creator?: string | null;
  is_disabled: boolean | null;
  full_name: string | null;
  extra_info_short?: string | null;
  extra_info?: string | null;
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
  // ModelCreator enum as a snake_case string, e.g. "bytedance", "open_ai".
  model_creator?: string | null;
  is_disabled: boolean | null;
  full_name: string | null;
  extra_info_short?: string | null;
  extra_info?: string | null;
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
  bitrate_options: string[] | null;
  bitrate_default: string | null;
  duration_seconds_options: number[] | null;
  duration_seconds_default: number | null;
  duration_seconds_min: number | null;
  duration_seconds_max: number | null;
  // Max duration when image references are used (e.g. Grok caps to 10s in
  // reference mode while allowing the full duration_seconds_max in keyframe mode).
  duration_seconds_max_with_image_references: number | null;
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
  character_references_supported: boolean | null;
  character_references_max: number | null;
  // Whether the model can generate from a text prompt at all (shows the prompt box).
  text_prompt_supported: boolean | null;
  // Whether the model can generate from text ALONE. When false, a text prompt
  // may still be used but an image (starting frame / reference) is also required.
  text_to_video_supported: boolean | null;
  text_prompt_max_length: number | null;
  negative_text_prompt_supported: boolean | null;
  negative_text_prompt_max_length: number | null;
}

export interface OmniGenVideoModelsResponse {
  success: boolean;
  models: OmniGenVideoModelInfo[];
  providers: OmniGenProviderEntry[];
}

// ── Audio model info (from GET /v1/omni_gen/models/audio) ────────────────

// Unlike the image/video model infos, absent capabilities are omitted from
// the JSON entirely (serde skip_serializing_if), so every field except
// `model` is optional. Treat undefined as unsupported.
export interface OmniGenAudioModelDetails {
  model: OmniGenAudioModelId | string;
  // ModelCreator enum as a snake_case string, e.g. "suno", "bytedance".
  model_creator?: string | null;
  full_name?: string | null;
  extra_info?: string | null;
  extra_info_short?: string | null;
  text_prompt_supported?: boolean | null;
  // Whether a style/genre prompt (Suno's "tags") is supported.
  style_prompt_supported?: boolean | null;
  audio_references_supported?: boolean | null;
  audio_references_max?: number | null;
  image_references_supported?: boolean | null;
  image_references_max?: number | null;
  // Whether the "keep lyrics" toggle is supported (Suno Remix).
  keep_lyrics_supported?: boolean | null;
  // Whether the instrumental-only toggle is supported (Suno Music / Sample).
  instrumental_toggle_supported?: boolean | null;
  // Whether the loop vs single-hit toggle is supported (Suno Sounds).
  loopable_toggle_supported?: boolean | null;
  bpm_supported?: boolean | null;
  musical_key_supported?: boolean | null;
  sample_rate_hz_options?: number[] | null;
  sample_rate_hz_default?: number | null;
  speed_supported?: boolean | null;
  volume_supported?: boolean | null;
  pitch_supported?: boolean | null;
  is_disabled?: boolean | null;
}

export interface OmniGenAudioModelsResponse {
  success: boolean;
  models: OmniGenAudioModelDetails[];
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
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v != null));
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

  public async getAudioModels(
    provider?: string,
  ): Promise<OmniGenAudioModelsResponse> {
    const query = provider ? { provider } : undefined;
    return this.get<OmniGenAudioModelsResponse>({
      endpoint: `${this.getApiSchemeAndHost()}/v1/omni_gen/models/audio`,
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

  public async estimateAudioCost(
    body: OmniGenAudioRequest,
  ): Promise<OmniGenAudioCostResponse> {
    return this.post<Record<string, unknown>, OmniGenAudioCostResponse>({
      endpoint: `${this.getApiSchemeAndHost()}/v1/omni_gen/cost/audio`,
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

  public async generateAudio(
    body: OmniGenAudioRequest,
  ): Promise<OmniGenAudioGenerateResponse> {
    return this.post<Record<string, unknown>, OmniGenAudioGenerateResponse>({
      endpoint: `${this.getApiSchemeAndHost()}/v1/omni_gen/generate/audio`,
      body: stripNulls(body),
    });
  }
}
