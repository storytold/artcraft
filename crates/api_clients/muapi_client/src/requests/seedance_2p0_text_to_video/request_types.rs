use serde_derive::{Deserialize, Serialize};

// --- Request ---

#[derive(Serialize, Debug)]
pub(super) struct Seedance2p0T2vRequest {
  pub prompt: String,
  pub aspect_ratio: &'static str,
  pub duration: u8,
  pub quality: &'static str,
}

// --- Response ---

#[derive(Deserialize, Debug)]
pub(super) struct Seedance2p0T2vResponse {
  pub request_id: String,
}
