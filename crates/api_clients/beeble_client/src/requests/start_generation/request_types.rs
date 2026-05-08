use serde_derive::{Deserialize, Serialize};

#[derive(Serialize)]
pub struct StartGenerationRequestBody {
  pub generation_type: String,
  pub source_uri: String,
  pub alpha_mode: String,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub prompt: Option<String>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub reference_image_uri: Option<String>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub alpha_uri: Option<String>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub max_resolution: Option<u16>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub callback_url: Option<String>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub idempotency_key: Option<String>,
}

#[derive(Deserialize, Debug, Clone)]
pub struct GenerationJobResponseBody {
  pub id: String,
  pub status: String,
  pub progress: Option<u8>,
  pub generation_type: Option<String>,
  pub alpha_mode: Option<String>,
  pub output: Option<GenerationOutput>,
  pub error: Option<String>,
  pub created_at: Option<String>,
  pub modified_at: Option<String>,
  pub completed_at: Option<String>,
  pub webhook: Option<WebhookStatus>,
}

#[derive(Deserialize, Debug, Clone)]
pub struct GenerationOutput {
  pub render: Option<String>,
  pub source: Option<String>,
  pub alpha: Option<String>,
}

#[derive(Deserialize, Debug, Clone)]
pub struct WebhookStatus {
  pub status: Option<String>,
  pub attempts: Option<u32>,
  pub last_error: Option<String>,
}
