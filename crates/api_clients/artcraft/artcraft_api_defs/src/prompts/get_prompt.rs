use crate::common::responses::media_links::MediaLinks;
use chrono::{DateTime, Utc};
use enums::by_table::prompt_context_items::prompt_context_semantic_type::PromptContextSemanticType;
use enums::by_table::prompts::prompt_type::PromptType;
use enums::common::generation::common_aspect_ratio::CommonAspectRatio;
use enums::common::generation::common_generation_mode::CommonGenerationMode;
use enums::common::generation::common_model_type::CommonModelType;
use enums::common::generation::common_resolution::CommonResolution;
use enums::common::generation_provider::GenerationProvider;
use enums::no_table::style_transfer::style_transfer_name::StyleTransferName;
use serde_derive::{Deserialize, Serialize};
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::prompts::PromptToken;
use utoipa::ToSchema;

pub const GET_PROMPT_PATH: &str = "/v1/prompts/{token}";

#[derive(Deserialize, ToSchema)]
pub struct GetPromptPathInfo {
  pub token: PromptToken,
}

#[derive(Serialize, ToSchema)]
pub struct GetPromptSuccessResponse {
  pub success: bool,
  pub prompt: PromptInfo,
}

#[derive(Serialize, ToSchema)]
pub struct GetPromptImageContextItem {
  pub media_token: MediaFileToken,
  pub semantic: PromptContextSemanticType,
  pub media_links: MediaLinks,
}

#[derive(Serialize, ToSchema)]
pub struct PromptInfo {
  pub token: PromptToken,

  /// The type of prompt.
  /// Note: Prompts may or may not be compatible across systems.
  pub prompt_type: PromptType,

  /// The type of model used
  pub maybe_model_type: Option<CommonModelType>,

  /// The service provider used
  pub maybe_generation_provider: Option<GenerationProvider>,

  /// Positive prompt (technically optional, but usually present)
  pub maybe_positive_prompt: Option<String>,

  /// Negative prompt (optional)
  pub maybe_negative_prompt: Option<String>,

  /// OPTIONAL. The generation mode (eg. keyframe, reference, inpaint, etc.)
  pub maybe_generation_mode: Option<CommonGenerationMode>,

  /// OPTIONAL. The aspect ratio (eg. square, auto, wide_three_by_two, etc.)
  pub maybe_aspect_ratio: Option<CommonAspectRatio>,

  /// OPTIONAL. The resolution (eg. one_k, two_k, four_k, etc.)
  pub maybe_resolution: Option<CommonResolution>,

  /// OPTIONAL. The number of outputs to generate (0-255).
  pub maybe_batch_count: Option<u8>,

  /// OPTIONAL. Whether to generate audio.
  pub maybe_generate_audio: Option<bool>,

  /// Context images (optional)
  pub maybe_context_images: Option<Vec<GetPromptImageContextItem>>,

  /// Scheduled / travel prompt (optional)
  pub maybe_travel_prompt: Option<String>,

  /// If a "style" was used, this is the name of it.
  /// This might not be present for all types of inference
  /// and typically only applies to video style transfer.
  pub maybe_style_name: Option<StyleTransferName>,

  /// How many milliseconds it took to run generation.
  pub maybe_inference_duration_millis: Option<u64>,

  /// If a "strength" was used.
  /// Typically only for video style transfer.
  pub maybe_strength: Option<f32>,

  /// If a frame skip setting was used.
  pub maybe_frame_skip: Option<u8>,

  /// If a face detailer was used.
  /// This might not be present for all types of inference
  /// and typically only applies to video style transfer.
  pub used_face_detailer: bool,

  /// If an upscaling pass was used.
  /// This might not be present for all types of inference
  /// and typically only applies to video style transfer.
  pub used_upscaler: bool,

  /// If lipsync was enabled.
  /// This might not be present for all types of inference
  /// and typically only applies to video style transfer.
  pub lipsync_enabled: bool,

  /// If LCM was disabled.
  /// Only staff can do this for now.
  pub lcm_disabled: bool,

  /// If the cinematic workflow was used.
  /// Only staff can do this for now.
  pub use_cinematic: bool,

  /// If a global IP Adapter Image was used, this is the details.
  /// NB: We can't easily query for this without another DB round trip,
  /// so the frontend should query for it instead.
  pub maybe_global_ipa_image_token: Option<MediaFileToken>,

  /// Fields that only moderators should see.
  pub maybe_moderator_fields: Option<PromptInfoModeratorFields>,

  pub created_at: DateTime<Utc>,
}

#[derive(Serialize, ToSchema)]
pub struct PromptInfoModeratorFields {
  /// How many milliseconds it took to run generation.
  pub maybe_inference_duration_millis: Option<u64>,

  /// Version of Yae's workflow
  /// Used for logging and debugging by the art team.
  pub main_ipa_workflow: Option<String>,

  /// Version of Yae's face detailer workflow
  /// Used for logging and debugging by the art team.
  pub face_detailer_workflow: Option<String>,

  /// Version of Yae's upscaler workflow
  /// Used for logging and debugging by the art team.
  pub upscaler_workflow: Option<String>,
}
