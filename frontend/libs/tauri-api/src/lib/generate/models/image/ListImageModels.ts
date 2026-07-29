import { invoke } from "@tauri-apps/api/core";
import { CommandResult } from "../../../common/CommandStatus";

// NB: enum-valued fields are typed as plain strings on purpose. The backend
// enums carry an `Unknown(String)` catch-all, so a newer server may return a
// value this build doesn't know; keeping them as strings keeps us forward-compatible.

export interface ListImageModelsSuccess extends CommandResult {
  payload: ListImageModelsPayload;
}

export interface ListImageModelsPayload {
  success: boolean;
  models: OmniGenImageModelDetails[];
  providers: OmniGenImageModelProviderDetails[];
}

export interface OmniGenImageModelProviderDetails {
  provider: string;
  models: OmniGenImageProviderModelDetails[];
}

export interface OmniGenImageProviderModelDetails {
  model: string;
  overrides?: OmniGenImageModelDetails;
}

export interface OmniGenImageModelDetails {
  model: string;
  model_creator?: string;
  full_name?: string;
  text_prompt_supported?: boolean;
  text_prompt_max_length?: number;
  negative_text_prompt_supported?: boolean;
  negative_text_prompt_max_length?: number;
  image_refs_supported?: boolean;
  image_refs_max?: number;
  has_fixed_editing_aspect_ratio?: boolean;
  aspect_ratio_options?: string[];
  aspect_ratio_default?: string;
  aspect_ratio_default_when_editing?: string;
  resolution_options?: string[];
  resolution_default?: string;
  quality_options?: string[];
  default_quality?: string;
  batch_size_min?: number;
  batch_size_max?: number;
  batch_size_options?: number[];
  batch_size_default?: number;
  is_disabled?: boolean;
}

/**
 * List available image models from the Tauri backend
 * (`list_image_models_command` — retried + cached 60s in the Rust layer).
 */
export const ListImageModels = async (): Promise<ListImageModelsSuccess> => {
  try {
    return (await invoke("list_image_models_command")) as ListImageModelsSuccess;
  } catch (error) {
    throw error;
  }
};
