use serde::{Deserialize, Serialize};

/// The payload sent inside `GmiCloudCreateRequest.payload` for seedance-2-0-260128.
#[derive(Debug, Serialize, Deserialize)]
pub struct Seedance20Payload {
  pub prompt: String,

  /// Duration in seconds (4–15). Default: 5.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub duration: Option<u8>,

  /// Output resolution: "480p", "720p", "1080p". Default: "720p".
  #[serde(skip_serializing_if = "Option::is_none")]
  pub resolution: Option<String>,

  /// Aspect ratio: "16:9", "4:3", "1:1", "3:4", "9:16", "21:9", "adaptive".
  #[serde(skip_serializing_if = "Option::is_none")]
  pub ratio: Option<String>,

  /// Random seed for reproducibility (0–4294967295).
  #[serde(skip_serializing_if = "Option::is_none")]
  pub seed: Option<u32>,

  /// Whether to embed a watermark. Default: false.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub watermark: Option<bool>,

  /// Whether to synthesize audio. Default: true.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub generate_audio: Option<bool>,

  /// Whether to enable web search grounding. Default: false.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub web_search: Option<bool>,

  /// First frame image URL for image-to-video generation.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub first_frame: Option<String>,

  /// Last frame image URL for image-to-video generation.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub last_frame: Option<String>,

  /// Reference image URLs.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub reference_images: Option<Vec<String>>,

  /// Reference video URLs.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub reference_videos: Option<Vec<String>>,

  /// Reference audio file URLs.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub reference_audios: Option<Vec<String>>,

  /// Pre-uploaded asset IDs.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub reference_asset_ids: Option<Vec<String>>,
}
