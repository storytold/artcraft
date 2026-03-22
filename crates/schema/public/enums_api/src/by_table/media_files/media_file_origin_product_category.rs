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
  use enums_shared::test_helpers::{assert_deserialization, assert_serialization};
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(MediaFileOriginProductCategory::Unknown, "unknown");
      assert_serialization(MediaFileOriginProductCategory::FaceAnimator, "face_animator");
      assert_serialization(MediaFileOriginProductCategory::FaceFusion, "face_fusion");
      assert_serialization(MediaFileOriginProductCategory::FaceMirror, "face_mirror");
      assert_serialization(MediaFileOriginProductCategory::VideoStyleTransfer, "vst");
      assert_serialization(MediaFileOriginProductCategory::ImageStudio, "image_studio");
      assert_serialization(MediaFileOriginProductCategory::StorytellerStudio, "studio");
      assert_serialization(MediaFileOriginProductCategory::TextToSpeech, "tts");
      assert_serialization(MediaFileOriginProductCategory::VoiceConversion, "voice_conversion");
      assert_serialization(MediaFileOriginProductCategory::ZeroShotVoice, "zs_voice");
      assert_serialization(MediaFileOriginProductCategory::Mocap, "mocap");
      assert_serialization(MediaFileOriginProductCategory::ImageGeneration, "image_gen");
      assert_serialization(MediaFileOriginProductCategory::VideoGeneration, "video_gen");
      assert_serialization(MediaFileOriginProductCategory::WorldGeneration, "world_gen");
      assert_serialization(MediaFileOriginProductCategory::VideoFilter, "video_filter");
      assert_serialization(MediaFileOriginProductCategory::Workflow, "workflow");
    }

    #[test]
    fn test_deserialization() {
      assert_deserialization("unknown", MediaFileOriginProductCategory::Unknown);
      assert_deserialization("face_animator", MediaFileOriginProductCategory::FaceAnimator);
      assert_deserialization("face_fusion", MediaFileOriginProductCategory::FaceFusion);
      assert_deserialization("face_mirror", MediaFileOriginProductCategory::FaceMirror);
      assert_deserialization("vst", MediaFileOriginProductCategory::VideoStyleTransfer);
      assert_deserialization("image_studio", MediaFileOriginProductCategory::ImageStudio);
      assert_deserialization("studio", MediaFileOriginProductCategory::StorytellerStudio);
      assert_deserialization("tts", MediaFileOriginProductCategory::TextToSpeech);
      assert_deserialization("voice_conversion", MediaFileOriginProductCategory::VoiceConversion);
      assert_deserialization("zs_voice", MediaFileOriginProductCategory::ZeroShotVoice);
      assert_deserialization("mocap", MediaFileOriginProductCategory::Mocap);
      assert_deserialization("image_gen", MediaFileOriginProductCategory::ImageGeneration);
      assert_deserialization("video_gen", MediaFileOriginProductCategory::VideoGeneration);
      assert_deserialization("world_gen", MediaFileOriginProductCategory::WorldGeneration);
      assert_deserialization("video_filter", MediaFileOriginProductCategory::VideoFilter);
      assert_deserialization("workflow", MediaFileOriginProductCategory::Workflow);
    }

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
