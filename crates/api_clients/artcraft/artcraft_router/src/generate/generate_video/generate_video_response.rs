use std::fmt::Debug;
use std::sync::Arc;

use muapi_client::api_types::request_id::RequestId as MuapiRequestId;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;

#[derive(Clone, Debug)]
pub struct ArtcraftVideoResponsePayload {
  pub inference_job_token: InferenceJobToken,
  pub all_inference_job_tokens: Vec<InferenceJobToken>,
}

#[derive(Clone, Debug)]
pub struct MuapiVideoResponsePayload {
  pub request_id: MuapiRequestId,
}

#[derive(Clone, Debug)]
pub struct Seedance2proVideoResponsePayload {
  pub order_id: String,
  pub task_id: String,
  pub maybe_order_ids: Option<Vec<String>>,
  pub maybe_task_ids: Option<Vec<String>>,
}

#[derive(Clone, Debug)]
pub struct FalVideoResponsePayload {
  pub request_id: Option<String>,
  pub gateway_request_id: Option<String>,

  /// The outbound request that was sent to Fal.
  /// Stored as a trait object so any Request type can be captured.
  /// Use `format!("{:?}", ...)` or `format!("{:#?}", ...)` to print.
  pub maybe_outbound_request: Option<Arc<dyn Debug + Send + Sync>>,
}

#[derive(Clone, Debug)]
pub struct GmiCloudVideoResponsePayload {
  pub request_id: String,
}

#[derive(Clone, Debug)]
pub enum GenerateVideoResponse {
  Artcraft(ArtcraftVideoResponsePayload),
  GmiCloud(GmiCloudVideoResponsePayload),
  Muapi(MuapiVideoResponsePayload),
  Seedance2Pro(Seedance2proVideoResponsePayload),
  Fal(FalVideoResponsePayload),
}

impl GenerateVideoResponse {
  pub fn get_artcraft_payload(&self) -> Option<ArtcraftVideoResponsePayload> {
    match self {
      Self::Artcraft(p) => Some(p.clone()),
      _ => None,
    }
  }

  pub fn get_muapi_payload(&self) -> Option<MuapiVideoResponsePayload> {
    match self {
      Self::Muapi(p) => Some(p.clone()),
      _ => None,
    }
  }

  pub fn get_seedance2pro_payload(&self) -> Option<Seedance2proVideoResponsePayload> {
    match self {
      Self::Seedance2Pro(p) => Some(p.clone()),
      _ => None,
    }
  }

  pub fn get_gmicloud_payload(&self) -> Option<GmiCloudVideoResponsePayload> {
    match self {
      Self::GmiCloud(p) => Some(p.clone()),
      _ => None,
    }
  }

  pub fn get_fal_payload(&self) -> Option<FalVideoResponsePayload> {
    match self {
      Self::Fal(p) => Some(p.clone()),
      _ => None,
    }
  }
}
