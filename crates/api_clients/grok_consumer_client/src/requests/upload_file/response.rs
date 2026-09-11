use serde::Deserialize;

#[derive(Deserialize)]
pub (super) struct GrokApiUploadFileResponse {
  
  /// The uploaded file_id, which is used to reference the file later.
  #[serde(rename = "fileMetadataId")]
  pub file_metadata_id: Option<String>,
  
  /// Partial path to the media file, not a full URI.
  /// eg. `users/{user_id}/{file_id}/content`
  #[serde(rename = "fileUri")]
  pub file_uri: Option<String>,
}

/*
{
  "fileMetadataId": "21a79085-e206-4b0b-88ac-5f2b7a453e45",
  "fileMimeType": "image/jpeg",
  "fileName": "0_0.jpeg",
  "fileUri": "users/85980643-ffab-4984-a3de-59a608c47d7f/21a79085-e206-4b0b-88ac-5f2b7a453e45/content",
  "parsedFileUri": "",
  "createTime": "2025-10-21T23:40:41.784448Z",
  "fileSource": "SELF_UPLOAD_FILE_SOURCE"
}
*/
