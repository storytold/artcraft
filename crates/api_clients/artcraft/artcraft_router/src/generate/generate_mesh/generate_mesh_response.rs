use std::fmt::Debug;
use std::sync::Arc;

use tokens::tokens::generic_inference_jobs::InferenceJobToken;

#[derive(Clone, Debug)]
pub struct ArtcraftMeshResponsePayload {
  pub inference_job_token: InferenceJobToken,
  pub all_inference_job_tokens: Vec<InferenceJobToken>,
}

#[derive(Clone, Debug)]
pub struct FalMeshResponsePayload {
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
pub enum GenerateMeshResponse {
  Artcraft(ArtcraftMeshResponsePayload),
  Fal(FalMeshResponsePayload),
}

impl GenerateMeshResponse {
  pub fn get_artcraft_payload(&self) -> Option<ArtcraftMeshResponsePayload> {
    match self {
      Self::Artcraft(p) => Some(p.clone()),
      _ => None,
    }
  }

  pub fn get_fal_payload(&self) -> Option<FalMeshResponsePayload> {
    match self {
      Self::Fal(p) => Some(p.clone()),
      _ => None,
    }
  }
}
