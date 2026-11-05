//! Reads the `video` key of a fal result (video models return the generated clip here).

use serde::Deserialize;
use serde_json::Value;

/// A generated video file. Every field is optional.
#[derive(Debug, Clone, Deserialize)]
pub struct PollResponseVideoData {
  /// Where to download the video.
  pub url: Option<String>,
  /// MIME type, e.g. "video/mp4".
  pub content_type: Option<String>,
  /// File name chosen by fal.
  pub file_name: Option<String>,
  /// Size in bytes.
  pub file_size: Option<u64>,
}

/// Returns the `video` object from `value`, or `None` if absent or not shaped like a file.
pub fn extract_video(value: &Value) -> Option<PollResponseVideoData> {
  let video = value.get("video")?;
  serde_json::from_value(video.clone()).ok()
}
