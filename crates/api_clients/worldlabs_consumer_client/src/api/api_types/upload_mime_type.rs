use serde::Serialize;

#[derive(Clone, Copy, Debug, Serialize)]
pub enum UploadMimeType {
  #[serde(rename = "image/jpeg")]
  ImageJpeg,
}

impl UploadMimeType {
  pub fn content_type(&self) -> &'static str {
    match self {
      Self::ImageJpeg => "image/jpeg",
    }
  }
  
  pub fn extension_without_period(&self) -> &'static str {
    match self {
      Self::ImageJpeg => "jpeg",
    }
  }
}
