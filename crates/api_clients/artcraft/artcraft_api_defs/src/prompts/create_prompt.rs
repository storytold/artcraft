use enums::common::generation::common_aspect_ratio::CommonAspectRatio;
use enums::common::generation::common_generation_mode::CommonGenerationMode;
use enums::common::generation::common_model_type::CommonModelType;
use enums::common::generation::common_resolution::CommonResolution;
use enums::common::generation_provider::GenerationProvider;
use serde_derive::{Deserialize, Serialize};
use tokens::tokens::prompts::PromptToken;
use utoipa::ToSchema;

pub const CREATE_PROMPT_PATH: &str = "/v1/prompts/create";

#[derive(Serialize, Deserialize, ToSchema)]
pub struct CreatePromptRequest {
  /// Idempotency token to prevent duplicate requests.
  pub uuid_idempotency_token: String,

  /// OPTIONAL. The positive prompt.
  pub positive_prompt: Option<String>,

  /// OPTIONAL. The negative prompt.
  pub negative_prompt: Option<String>,

  /// OPTIONAL. The model type.
  pub model_type: Option<CommonModelType>,

  /// OPTIONAL. The service used.
  pub generation_provider: Option<GenerationProvider>,

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
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct CreatePromptResponse {
  pub success: bool,
  pub prompt_token: PromptToken,
}
