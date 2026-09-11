use serde_derive::Deserialize;

/// Response shape for DELETE /v1/files/{file_id}.
///
/// Docs: <https://docs.x.ai/developers/rest-api-reference/files/manage>
#[derive(Deserialize, Debug, Clone)]
pub(crate) struct DeleteFileResponseBody {
  pub id: Option<String>,

  /// xAI returns `true` on a successful delete.
  pub deleted: Option<bool>,
}
