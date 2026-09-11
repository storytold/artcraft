use crate::prompts::get_prompt::GetPromptImageContextItem;
use chrono::{DateTime, Utc};
use enums::by_table::prompts::prompt_type::PromptType;
use enums::common::generation::common_aspect_ratio::CommonAspectRatio;
use enums::common::generation::common_bitrate::CommonBitrate;
use enums::common::generation::common_generation_mode::CommonGenerationMode;
use enums::common::generation::common_model_class::CommonModelClass;
use enums::common::generation::common_model_type::CommonModelType;
use enums::common::generation::common_resolution::CommonResolution;
use enums::common::generation_provider::GenerationProvider;
use std::collections::HashSet;

use serde_derive::{Deserialize, Serialize};
use tokens::tokens::prompts::PromptToken;
use utoipa::{IntoParams, ToSchema};

pub const BATCH_GET_PROMPTS_PATH: &str = "/v1/prompt/batch";

#[derive(Deserialize, ToSchema, IntoParams)]
pub struct BatchGetPromptsQuery {
  /// Prompt tokens to look up.
  pub tokens: HashSet<String>,
}

#[derive(Serialize, ToSchema)]
pub struct BatchGetPromptsResponse {
  pub success: bool,
  pub prompts: Vec<BatchPromptInfo>,
}

#[derive(Serialize, ToSchema)]
pub struct BatchPromptInfo {
  pub token: PromptToken,

  /// The type of model used
  pub maybe_model_type: Option<CommonModelType>,

  /// The class of model used
  pub maybe_model_class: Option<CommonModelClass>,

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

  /// OPTIONAL. The output bitrate (eg. normal, high).
  pub maybe_bitrate: Option<CommonBitrate>,

  /// OPTIONAL. The number of outputs to generate (0-255).
  pub maybe_batch_count: Option<u8>,

  /// OPTIONAL. Whether to generate audio.
  pub maybe_generate_audio: Option<bool>,

  /// OPTIONAL. The duration in seconds.
  pub maybe_duration_seconds: Option<u32>,

  /// Context images (optional)
  pub maybe_context_images: Option<Vec<GetPromptImageContextItem>>,

  pub created_at: DateTime<Utc>,
}
