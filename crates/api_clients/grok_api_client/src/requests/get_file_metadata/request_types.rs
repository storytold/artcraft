use serde_derive::Deserialize;

/// Response shape for GET /v1/files/{file_id}. Same envelope as the upload
/// response (xAI returns identical file objects from both endpoints).
///
/// Docs: <https://docs.x.ai/developers/rest-api-reference/files/manage>
#[derive(Deserialize, Debug, Clone)]
pub(crate) struct FileMetadataResponseBody {
  pub id: String,
  pub bytes: Option<u64>,
  pub created_at: Option<i64>,
  pub expires_at: Option<i64>,
  pub filename: Option<String>,
  pub purpose: Option<String>,
}
