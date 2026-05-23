use serde_derive::Deserialize;

/// Response shape for POST /v1/files. Matches OpenAI-style file objects.
///
/// Docs: <https://docs.x.ai/developers/rest-api-reference/files/upload>
#[derive(Deserialize, Debug, Clone)]
pub(crate) struct UploadFileResponseBody {
  pub id: String,
  pub bytes: Option<u64>,
  pub created_at: Option<i64>,
  pub expires_at: Option<i64>,
  pub filename: Option<String>,
  pub purpose: Option<String>,
}
