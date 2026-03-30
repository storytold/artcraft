use serde_derive::{Deserialize, Serialize};
use utoipa::ToSchema;

use enums::common::generation::common_model_type::CommonModelType;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::media_files::MediaFileToken;

/// Request body for creating a character.
#[derive(Deserialize, ToSchema)]
pub struct CreateCharacterRequest {
  /// Idempotency token to prevent duplicate requests.
  pub uuid_idempotency_token: String,

  /// The model to create the character for.
  pub model: CommonModelType,

  /// The reference image media file token.
  pub image_media_token: MediaFileToken,
}

/// Response body for creating a character.
#[derive(Serialize, ToSchema)]
pub struct CreateCharacterResponse {
  pub success: bool,
  pub inference_job_token: InferenceJobToken,
}
