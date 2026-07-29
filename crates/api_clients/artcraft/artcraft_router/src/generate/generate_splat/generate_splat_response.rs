use std::fmt::Debug;
use std::sync::Arc;

use tokens::tokens::generic_inference_jobs::InferenceJobToken;

#[derive(Clone, Debug)]
pub struct ArtcraftSplatResponsePayload {
  pub inference_job_token: InferenceJobToken,
  pub all_inference_job_tokens: Vec<InferenceJobToken>,
}

#[derive(Clone, Debug)]
pub struct WorldLabsSplatResponsePayload {
  /// The World Labs operation ID; poll it for generation status.
  pub operation_id: String,
  pub done: bool,
}

/// Fal's queue/webhook submission receipt for a splat generation.
#[derive(Clone, Debug)]
pub struct FalSplatResponsePayload {
  /// Fal's ID for the queued request. Present on queue submissions and on
  /// most webhook submissions.
  pub request_id: Option<String>,

  /// Gateway request ID (webhook submissions).
  pub gateway_request_id: Option<String>,

  /// Queue-mode status polling URL.
  pub maybe_status_url: Option<String>,

  /// Queue-mode response URL.
  pub maybe_response_url: Option<String>,

  /// The outbound request we sent, for debug logging.
  pub maybe_outbound_request: Option<Arc<dyn Debug + Send + Sync>>,
}

#[derive(Clone, Debug)]
pub enum GenerateSplatResponse {
  Artcraft(ArtcraftSplatResponsePayload),
  Fal(FalSplatResponsePayload),
  WorldLabs(WorldLabsSplatResponsePayload),
}

impl GenerateSplatResponse {
  pub fn get_artcraft_payload(&self) -> Option<ArtcraftSplatResponsePayload> {
    match self {
      Self::Artcraft(p) => Some(p.clone()),
      _ => None,
    }
  }

  pub fn get_fal_payload(&self) -> Option<FalSplatResponsePayload> {
    match self {
      Self::Fal(p) => Some(p.clone()),
      _ => None,
    }
  }

  pub fn get_worldlabs_payload(&self) -> Option<WorldLabsSplatResponsePayload> {
    match self {
      Self::WorldLabs(p) => Some(p.clone()),
      _ => None,
    }
  }
}
