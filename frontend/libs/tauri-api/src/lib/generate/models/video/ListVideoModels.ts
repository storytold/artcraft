import { invoke } from "@tauri-apps/api/core";
import { CommandResult } from "../../../common/CommandStatus";

// NB: enum-valued fields are typed as plain strings for forward-compatibility
// (the backend enums have an `Unknown(String)` catch-all).

export interface ListVideoModelsSuccess extends CommandResult {
  payload: ListVideoModelsPayload;
}

export interface ListVideoModelsPayload {
  success: boolean;
  models: OmniGenVideoModelDetails[];
  providers: OmniGenVideoModelProviderDetails[];
}

export interface OmniGenVideoModelProviderDetails {
  provider: string;
  models: OmniGenVideoProviderModelDetails[];
}

export interface OmniGenVideoProviderModelDetails {
  model: string;
  overrides?: OmniGenVideoModelDetails;
}

export interface OmniGenVideoModelDetails {
  model: string;
  model_creator?: string;
  full_name?: string;
  extra_info?: string;
  extra_info_short?: string;
  text_to_video_supported?: boolean;
  text_prompt_supported?: boolean;
  text_prompt_max_length?: number;
  negative_text_prompt_supported?: boolean;
  negative_text_prompt_max_length?: number;
  starting_keyframe_supported?: boolean;
  starting_keyframe_required?: boolean;
  ending_keyframe_supported?: boolean;
  image_references_supported?: boolean;
  image_references_max?: number;
  video_references_supported?: boolean;
  video_references_max?: number;
  video_references_max_total_duration_seconds?: number;
  audio_references_supported?: boolean;
  audio_references_max?: number;
  audio_references_max_total_duration_seconds?: number;
  character_references_supported?: boolean;
  character_references_max?: number;
  show_generate_with_sound_toggle?: boolean;
  aspect_ratio_options?: string[];
  aspect_ratio_default?: string;
  resolution_options?: string[];
  resolution_default?: string;
  bitrate_options?: string[];
  bitrate_default?: string;
  quality_options?: string[];
  default_quality?: string;
  duration_seconds_min?: number;
  duration_seconds_max?: number;
  duration_seconds_max_with_image_references?: number;
  duration_seconds_options?: number[];
  duration_seconds_default?: number;
  batch_size_min?: number;
  batch_size_max?: number;
  batch_size_options?: number[];
  batch_size_default?: number;
  is_disabled?: boolean;
}

/**
 * List available video models from the Tauri backend
 * (`list_video_models_command` — retried + cached 60s in the Rust layer).
 */
export const ListVideoModels = async (): Promise<ListVideoModelsSuccess> => {
  try {
    return (await invoke("list_video_models_command")) as ListVideoModelsSuccess;
  } catch (error) {
    throw error;
  }
};
