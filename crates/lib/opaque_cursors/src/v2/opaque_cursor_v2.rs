use serde_derive::{Deserialize, Serialize};

/// An opaque cursor payload that encodes pagination state.
///
/// This gets encrypted and sent to the frontend as an opaque handle.
/// The frontend cannot read or forge these cursors.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct OpaqueCursorV2 {
  /// Name for the cursor type.
  #[serde(skip_serializing_if = "Option::is_none")]
  #[serde(rename = "n")]
  pub name: Option<String>,

  /// The id of the last ordered element we fetched, so the next page
  /// will start after (or before) this id depending on sort direction.
  #[serde(skip_serializing_if = "Option::is_none")]
  #[serde(rename = "l")]
  pub last_id: Option<u64>,
}
