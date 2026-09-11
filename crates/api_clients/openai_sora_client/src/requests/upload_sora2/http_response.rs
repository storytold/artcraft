use serde_derive::Deserialize;

#[derive(Debug, Deserialize)]
pub struct SoraMediaUploadResponse {
  /// This is the media token id.
  pub id: String,

  // NB: Don't need these, so commented out:
  //pub r#type: String,
  //pub created_at: String,
  //pub filename: String,
  //pub extension: String,
  //pub mime_type: String,
  //pub url: String,
  //pub width: Option<u32>,
  //pub height: Option<u32>,
  //pub duration_sec: Option<f64>,
  //pub n_frames: Option<u32>,
  //pub size_bytes: u64,
  //pub thumbnail_url: Option<String>,
}
