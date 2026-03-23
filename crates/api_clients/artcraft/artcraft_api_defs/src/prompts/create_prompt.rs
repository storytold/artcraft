use serde_derive::{Deserialize, Serialize};
use tokens::tokens::prompts::PromptToken;
use utoipa::ToSchema;
use enums::common::generation_provider::GenerationProvider;
use enums::common::generation::common_model_type::CommonModelType;

pub const CREATE_PROMPT_PATH: &str = "/v1/prompts/create";

#[derive(Serialize, Deserialize, ToSchema)]
pub struct CreatePromptRequest {
  /// Idempotency token to prevent duplicate requests.
  pub uuid_idempotency_token: String,

  /// OPTIONAL. The positive prompt.
  pub positive_prompt: Option<String>,

  /// OPTIONAL. The positive prompt.
  pub negative_prompt: Option<String>,
  
  /// OPTIONAL. The model type.
  pub model_type: Option<CommonModelType>,

  /// OPTIONAL. The service used.
  pub generation_provider: Option<GenerationProvider>,
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct CreatePromptResponse {
  pub success: bool,
  pub prompt_token: PromptToken,
}
