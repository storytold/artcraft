//! Reads the `images` array of a fal result (text-to-image and image-edit models return their
//! pictures here, one entry per generated image).

use serde::Deserialize;
use serde_json::Value;

/// One image in the `images` array. Every field is optional because models differ in what they send.
#[derive(Debug, Clone, Deserialize)]
pub struct PollResponseImageEntry {
  /// Where to download the image.
  pub url: Option<String>,
  /// Width in pixels.
  pub width: Option<u64>,
  /// Height in pixels.
  pub height: Option<u64>,
  /// MIME type, e.g. "image/jpeg".
  pub content_type: Option<String>,
  /// File name chosen by fal.
  pub file_name: Option<String>,
  /// Size in bytes.
  pub file_size: Option<u64>,
}

/// Returns every parseable entry of the `images` array, or `None` if the key is absent, is not
/// an array, or no entry could be parsed.
pub fn extract_images(value: &Value) -> Option<Vec<PollResponseImageEntry>> {
  let arr = value.get("images")?.as_array()?;
  // Entries that fail to parse are dropped rather than failing the whole result.
  let images: Vec<PollResponseImageEntry> = arr.iter()
    .filter_map(|v| serde_json::from_value(v.clone()).ok())
    .collect();
  if images.is_empty() { None } else { Some(images) }
}
