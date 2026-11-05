//! Reads the `thumbnail` key of a fal result (3D mesh models return a preview picture here).

use serde::Deserialize;
use serde_json::Value;

/// A preview image file. Every field is optional.
#[derive(Debug, Clone, Deserialize)]
pub struct PollResponseThumbnailData {
  /// Where to download the thumbnail.
  pub url: Option<String>,
  /// MIME type, e.g. "image/png".
  pub content_type: Option<String>,
  /// File name chosen by fal.
  pub file_name: Option<String>,
  /// Size in bytes.
  pub file_size: Option<u64>,
}

/// Returns the `thumbnail` object from `value`, or `None` if absent or not shaped like a file.
pub fn extract_thumbnail(value: &Value) -> Option<PollResponseThumbnailData> {
  let thumbnail = value.get("thumbnail")?;
  serde_json::from_value(thumbnail.clone()).ok()
}
