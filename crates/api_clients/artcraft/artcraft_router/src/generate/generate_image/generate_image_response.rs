use tokens::tokens::generic_inference_jobs::InferenceJobToken;

#[derive(Clone, Debug)]
pub struct ArtcraftImageResponsePayload {
  pub inference_job_token: InferenceJobToken,
}

#[derive(Clone, Debug)]
pub struct FalImageResponsePayload {
  pub request_id: Option<String>,
  pub gateway_request_id: Option<String>,
}

#[derive(Clone, Debug)]
pub enum GenerateImageResponse {
  Artcraft(ArtcraftImageResponsePayload),
  Fal(FalImageResponsePayload),
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
}
