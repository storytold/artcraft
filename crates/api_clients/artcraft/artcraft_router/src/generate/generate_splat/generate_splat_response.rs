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

#[derive(Clone, Debug)]
pub enum GenerateSplatResponse {
  Artcraft(ArtcraftSplatResponsePayload),
  WorldLabs(WorldLabsSplatResponsePayload),
}

impl GenerateSplatResponse {
  pub fn get_artcraft_payload(&self) -> Option<ArtcraftSplatResponsePayload> {
    match self {
      Self::Artcraft(p) => Some(p.clone()),
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
