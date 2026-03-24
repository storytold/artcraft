export interface PromptContextImage {
  media_links: {
    cdn_url: string;
    maybe_thumbnail_template: string | null;
    maybe_video_previews: {
      animated: string;
      animated_thumbnail_template: string;
      still: string;
      still_thumbnail_template: string;
    } | null;
  };
  media_token: string;
  semantic: string;
}

export interface Prompts {
  created_at: string;
  lcm_disabled: boolean;
  lipsync_enabled: boolean;
  maybe_aspect_ratio: string | null;
  maybe_batch_count: number | null;
  maybe_context_images: PromptContextImage[] | null;
  maybe_duration_seconds: number | null;
  maybe_frame_skip: number | null;
  maybe_generate_audio: boolean | null;
  maybe_generation_mode: string | null;
  maybe_generation_provider: string | null;
  maybe_global_ipa_image_token: string | null;
  maybe_inference_duration_millis: number | null;
  maybe_model_class: string | null;
  maybe_model_type: string | null;
  maybe_moderator_fields: string | null;
  maybe_negative_prompt: string | null;
  maybe_positive_prompt: string | null;
  maybe_resolution: string | null;
  maybe_strength: number | null;
  maybe_style_name: string | null;
  maybe_travel_prompt: string | null;
  prompt_type: string;
  token: string;
  use_cinematic: boolean;
  used_face_detailer: boolean;
  used_upscaler: boolean;
}
