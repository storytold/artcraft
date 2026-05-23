use serde::Serialize;

#[derive(Serialize)]
pub (super) struct UploadFileRequest {
  #[serde(rename="fileName")]
  pub fileName: String,

  #[serde(rename="fileMimeType")]
  pub fileMimeType: String,

  /// Base64-encoded content
  pub content: String,

  /// eg. 'IMAGINE_SELF_UPLOAD_FILE_SOURCE'
  #[serde(rename="fileSource")]
  pub fileSource: String,
}

