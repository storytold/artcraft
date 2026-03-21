use std::collections::HashSet;

use utoipa::ToSchema;

use enums_db::by_table::media_files::media_file_origin_product_category::MediaFileOriginProductCategory;

/// AutoProductCategory can be used in APIs to auto-expand to multiple product categories,
/// deprecated product categories, etc.
///
/// For example, "voice" expands to ["tts", "zs_voice", "voice_conversion"]
///
/// These can also alias bad product names, eg "live_portrait" is an alias for "face_mirror"
#[derive(Debug, PartialEq, Eq, Clone, Copy, Serialize, Deserialize, Hash, PartialOrd, Ord, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum AutoProductCategory {
  // ===== Synthetic product categories that alias or auto-expand to multiple ===== //

  /// Synthetic category that expands to ["tts", "zs_voice", "voice_conversion"]
  Voice,

  // ===== Synthetic product categories that alias others ===== //

  /// Synthetic category that expands to ["face_animator"]
  Lipsync,

  /// This is an alias for "face_mirror"
  LivePortrait,

  // ===== Current Database Product Categories ===== //

  FaceAnimator,

  FaceMirror,

  #[serde(rename = "vst")]
  VideoStyleTransfer,

  #[serde(rename = "studio")]
  StorytellerStudio,

  #[serde(rename = "tts")]
  TextToSpeech,

  VoiceConversion,

  #[serde(rename = "zs_voice")]
  ZeroShotVoice,

  Mocap,

  #[serde(rename = "image_gen")]
  ImageGeneration,

  // ===== Deprecated Database Product Categories ===== //

  #[deprecated]
  VideoFilter,

  #[deprecated]
  Workflow,
}

impl AutoProductCategory {
  pub fn expand_to_db_product_categories(&self) -> HashSet<MediaFileOriginProductCategory> {
    match self {
      // Synthetic product categories that auto-expand to multiple
      AutoProductCategory::Voice => HashSet::from([
        MediaFileOriginProductCategory::TextToSpeech,
        MediaFileOriginProductCategory::ZeroShotVoice,
        MediaFileOriginProductCategory::VoiceConversion,
      ]),

      // Synthetic product categories that alias other product categories
      AutoProductCategory::Lipsync => HashSet::from([MediaFileOriginProductCategory::FaceAnimator]),
      AutoProductCategory::LivePortrait => HashSet::from([MediaFileOriginProductCategory::FaceMirror]),

      // Current database product categories
      AutoProductCategory::FaceAnimator => HashSet::from([MediaFileOriginProductCategory::FaceAnimator]),
      AutoProductCategory::FaceMirror => HashSet::from([MediaFileOriginProductCategory::FaceMirror]),
      AutoProductCategory::VideoStyleTransfer => HashSet::from([MediaFileOriginProductCategory::VideoStyleTransfer]),
      AutoProductCategory::StorytellerStudio => HashSet::from([MediaFileOriginProductCategory::StorytellerStudio]),
      AutoProductCategory::TextToSpeech => HashSet::from([MediaFileOriginProductCategory::TextToSpeech]),
      AutoProductCategory::VoiceConversion => HashSet::from([MediaFileOriginProductCategory::VoiceConversion]),
      AutoProductCategory::ZeroShotVoice => HashSet::from([MediaFileOriginProductCategory::ZeroShotVoice]),
      AutoProductCategory::Mocap => HashSet::from([MediaFileOriginProductCategory::Mocap]),
      AutoProductCategory::ImageGeneration => HashSet::from([MediaFileOriginProductCategory::ImageGeneration]),

      // Deprecated database product categories
      AutoProductCategory::VideoFilter => HashSet::from([MediaFileOriginProductCategory::VideoFilter]),
      AutoProductCategory::Workflow => HashSet::from([MediaFileOriginProductCategory::Workflow]),
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      // Synthetic product categories that auto-expand to multiple
      "voice" => Ok(Self::Voice),

      // Synthetic product categories that alias other product categories
      "lipsync" => Ok(Self::Lipsync),
      "live_portrait" => Ok(Self::LivePortrait),

      // Current database product categories
      "face_animator" => Ok(Self::FaceAnimator),
      "face_mirror" => Ok(Self::FaceMirror),
      "vst" => Ok(Self::VideoStyleTransfer),
      "studio" => Ok(Self::StorytellerStudio),
      "tts" => Ok(Self::TextToSpeech),
      "voice_conversion" => Ok(Self::VoiceConversion),
      "zs_voice" => Ok(Self::ZeroShotVoice),
      "mocap" => Ok(Self::Mocap),
      "image_gen" => Ok(Self::ImageGeneration),

      // Deprecated database product categories
      "video_filter" => Ok(Self::VideoFilter),
      "workflow" => Ok(Self::Workflow),

      _ => Err(format!("Invalid AutoProductCategory: {}", value)),
    }
  }
}
