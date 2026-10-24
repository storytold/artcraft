//! Reads the single `image` key of a fal result (used by models that return one picture,
//! such as background removal). Models that return several use `extract_images` instead.

use serde::Deserialize;
use serde_json::Value;

/// One image file returned by fal. Every field is optional because models differ in what they send.
#[derive(Debug, Clone, Deserialize)]
pub struct PollResponseSingleImageData {
  /// Where to download the image.
  pub url: Option<String>,
  /// Width in pixels.
  pub width: Option<u64>,
  /// Height in pixels.
  pub height: Option<u64>,
  /// MIME type, e.g. "image/png".
  pub content_type: Option<String>,
  /// File name chosen by fal.
  pub file_name: Option<String>,
  /// Size in bytes.
  pub file_size: Option<u64>,
}

/// Returns the `image` object from `value`, or `None` if the key is absent or not shaped like an image.
pub fn extract_image(value: &Value) -> Option<PollResponseSingleImageData> {
  let image = value.get("image")?;
  serde_json::from_value(image.clone()).ok()
}
