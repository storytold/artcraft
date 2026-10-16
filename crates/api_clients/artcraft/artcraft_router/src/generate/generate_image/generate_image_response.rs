use std::fmt::Debug;
use std::sync::Arc;

use openrouter_client::api::generate_image::OpenRouterImage;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;

#[derive(Clone, Debug)]
pub struct ArtcraftImageResponsePayload {
  pub inference_job_token: InferenceJobToken,
}

#[derive(Clone, Debug)]
pub struct FalImageResponsePayload {
  pub request_id: Option<String>,
  pub gateway_request_id: Option<String>,

  /// The queue status URL (for polling job progress).
  pub maybe_status_url: Option<String>,

  /// The queue response URL (for fetching completed results).
  pub maybe_response_url: Option<String>,

  /// The outbound request that was sent to Fal.
  /// Stored as a trait object so any Request type can be captured.
  /// Use `format!("{:?}", ...)` or `format!("{:#?}", ...)` to print.
  pub maybe_outbound_request: Option<Arc<dyn Debug + Send + Sync>>,
}

/// Response from the KinoviWeb/Kinovi provider (used for Midjourney
/// image generation). Mirrors `KinoviWebVideoResponsePayload` on the
/// video side.
#[derive(Clone, Debug)]
pub struct KinoviWebImageResponsePayload {
  pub order_id: String,
  pub task_id: String,
  pub maybe_order_ids: Option<Vec<String>>,
  pub maybe_task_ids: Option<Vec<String>>,
}

/// OpenRouter answers with the finished images (there is no job to poll).
#[derive(Clone, Debug)]
pub struct OpenRouterImageResponsePayload {
  pub images: Vec<OpenRouterImage>,
  /// What OpenRouter charged the user's account, in US dollars.
  pub maybe_cost_usd: Option<f64>,
}

#[derive(Clone, Debug)]
pub enum GenerateImageResponse {
  Midjourney(MidjourneyImageResponsePayload),
  Artcraft(ArtcraftImageResponsePayload),
  Fal(FalImageResponsePayload),
  KinoviWeb(KinoviWebImageResponsePayload),
  OpenRouter(OpenRouterImageResponsePayload),
}

impl GenerateImageResponse {
  pub fn get_artcraft_payload(&self) -> Option<ArtcraftImageResponsePayload> {
    match self {
      Self::Artcraft(p) => Some(p.clone()),
      _ => None,
    }
  }

  pub fn get_fal_payload(&self) -> Option<FalImageResponsePayload> {
    match self {
      Self::Fal(p) => Some(p.clone()),
      _ => None,
    }
  }

  pub fn get_openrouter_payload(&self) -> Option<OpenRouterImageResponsePayload> {
    match self {
      Self::OpenRouter(p) => Some(p.clone()),
      _ => None,
    }
  }

  pub fn get_kinovi_web_payload(&self) -> Option<KinoviWebImageResponsePayload> {
    match self {
      Self::KinoviWeb(p) => Some(p.clone()),
      _ => None,
    }
  }
}

#[derive(Clone, Debug)]
pub struct MidjourneyImageResponsePayload {
  pub job_id: String,
}
