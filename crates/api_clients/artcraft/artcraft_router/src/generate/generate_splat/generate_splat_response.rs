use tokens::tokens::generic_inference_jobs::InferenceJobToken;

#[derive(Clone, Debug)]
pub struct ArtcraftSplatResponsePayload {
  pub inference_job_token: InferenceJobToken,
}

#[derive(Clone, Debug)]
pub enum GenerateSplatResponse {
  Artcraft(ArtcraftSplatResponsePayload),
}

impl GenerateSplatResponse {
  pub fn get_artcraft_payload(&self) -> Option<ArtcraftSplatResponsePayload> {
    match self {
      Self::Artcraft(p) => Some(p.clone()),
    }
  }
}
