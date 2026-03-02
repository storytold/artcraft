use tokens::tokens::generic_inference_jobs::InferenceJobToken;

#[derive(Clone, Debug)]
pub struct ArtcraftVideoResponsePayload {
  pub inference_job_token: InferenceJobToken,
  pub all_inference_job_tokens: Vec<InferenceJobToken>,
}

#[derive(Clone, Debug)]
pub enum GenerateVideoResponse {
  Artcraft(ArtcraftVideoResponsePayload),
}

impl GenerateVideoResponse {
  pub fn get_artcraft_payload(&self) -> Option<ArtcraftVideoResponsePayload> {
    match self {
      Self::Artcraft(p) => Some(p.clone()),
    }
  }
}
