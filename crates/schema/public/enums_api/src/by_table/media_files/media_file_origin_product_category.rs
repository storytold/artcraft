use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `media_files` table in `VARCHAR(16)` field `origin_product_category`.
///
/// This value indicates what product originally created the media file. (Not the ML model or
/// user upload process.) This will let us scope media files to the product that generated them
/// and filter them out of unrelated products if necessary (eg. a user probably doesn't want
/// "Voice Designer" dataset samples in a video generation flow.)
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize, ToSchema, EnumIter, Debug)]

pub enum MediaFileOriginProductCategory {
  /// Unknown which product is attached to the file (generated the file, the file was
  /// uploaded on behalf of, etc.)
  #[serde(rename = "unknown")]
  Unknown,

  /// Media files created by (or uploaded for) the Face Animator product.
  /// The underlying model could be SadTalker, Wav2Lip, or some future model
  #[serde(rename = "face_animator")]
  FaceAnimator,

  /// Media files created by Face Fusion (lipsync)
  #[serde(rename = "face_fusion")]
  FaceFusion,

  /// Media files created by Face Mirror (currently powered by Live Portrait)
  #[serde(rename = "face_mirror")]
  FaceMirror,

  /// Video style transfer
  #[serde(rename = "vst")]
  VideoStyleTransfer,

  /// Image Studio
  #[serde(rename = "image_studio")]
  ImageStudio,

  /// Storyteller Studio
  #[serde(rename = "studio")]
  StorytellerStudio,

  /// Text to speech (Tacotron2, not voice designer / VallE-X)
  #[serde(rename = "tts")]
  TextToSpeech,

  /// Voice conversion (either RVC or SVC)
  #[serde(rename = "voice_conversion")]
  VoiceConversion,

  /// Media files created by (or uploaded for) the Zero Shot voice product.
  #[serde(rename = "zs_voice")]
  ZeroShotVoice,

  // Mocap
  #[serde(rename = "mocap")]
  Mocap,

  #[serde(rename = "image_gen")]
  ImageGeneration,

  #[serde(rename = "video_gen")]
  VideoGeneration,

  #[serde(rename = "world_gen")]
  WorldGeneration,

  // Media files for video filters
  #[deprecated(note = "This isn't relevant product surface area anymore")]
  #[serde(rename = "video_filter")]
  VideoFilter,

  // Workflow
  #[deprecated(note = "Use studio and VST instead.")]
  #[serde(rename = "workflow")]
  Workflow,
}

#[cfg(test)]
mod tests {
  use super::MediaFileOriginProductCategory;
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn variants_count_check() {
      assert_eq!(MediaFileOriginProductCategory::iter().count(), 16);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in MediaFileOriginProductCategory::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: MediaFileOriginProductCategory = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
