export interface Prompts {
  created_at: string;
  lcm_disabled: boolean;
  lipsync_enabled: boolean;
  maybe_inference_duration_millis: number;
  maybe_moderator_fields: string;
  maybe_negative_prompt: string;
  maybe_positive_prompt: string;
  maybe_strength: number;
  maybe_style_name: string;
  prompt_type: string;
  token: string;
  use_cinematic: boolean;
  used_face_detailer: boolean;
  used_upscaler: boolean;
}
