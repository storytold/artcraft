use std::fmt::Debug;
use std::sync::Arc;

use tokens::tokens::generic_inference_jobs::InferenceJobToken;

#[derive(Clone, Debug)]
pub struct ArtcraftAudioResponsePayload {
  pub inference_job_token: InferenceJobToken,
  pub all_inference_job_tokens: Vec<InferenceJobToken>,
}

#[derive(Clone, Debug)]
pub struct KinoviWebAudioResponsePayload {
  pub order_id: String,
  pub task_id: String,
}

#[derive(Clone, Debug)]
pub struct FalAudioResponsePayload {
  pub request_id: Option<String>,
  pub gateway_request_id: Option<String>,

  /// Queue-mode status URL (fal's queue/polling flow). `None` for webhook
  /// dispatch — the webhook callback drives status updates instead.
  pub maybe_status_url: Option<String>,

  /// Queue-mode response URL (fal's queue/polling flow). `None` for webhook
  /// dispatch.
  pub maybe_response_url: Option<String>,

  /// The outbound request that was sent to Fal.
  /// Stored as a trait object so any Request type can be captured.
  /// Use `format!("{:?}", ...)` or `format!("{:#?}", ...)` to print.
  pub maybe_outbound_request: Option<Arc<dyn Debug + Send + Sync>>,
}

#[derive(Clone, Debug)]
pub enum GenerateAudioResponse {
  Artcraft(ArtcraftAudioResponsePayload),
  KinoviWeb(KinoviWebAudioResponsePayload),
  Fal(FalAudioResponsePayload),
}

impl GenerateAudioResponse {
  pub fn get_artcraft_payload(&self) -> Option<ArtcraftAudioResponsePayload> {
    match self {
      Self::Artcraft(p) => Some(p.clone()),
      _ => None,
    }
  }

  pub fn get_kinovi_web_payload(&self) -> Option<KinoviWebAudioResponsePayload> {
    match self {
      Self::KinoviWeb(p) => Some(p.clone()),
      _ => None,
    }
  }

  pub fn get_fal_payload(&self) -> Option<FalAudioResponsePayload> {
    match self {
      Self::Fal(p) => Some(p.clone()),
      _ => None,
    }
  }
}
