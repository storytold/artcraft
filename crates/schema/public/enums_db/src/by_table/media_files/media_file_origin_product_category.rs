use strum::EnumCount;
use strum::EnumIter;

/// Used in the `media_files` table in `VARCHAR(16)` field `origin_product_category`.
///
/// This value indicates what product originally created the media file. (Not the ML model or
/// user upload process.) This will let us scope media files to the product that generated them
/// and filter them out of unrelated products if necessary (eg. a user probably doesn't want
/// "Voice Designer" dataset samples in a video generation flow.)
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize, EnumIter, EnumCount)]
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

// TODO(bt, 2022-12-21): This desperately needs MySQL integration tests!
impl_enum_display_and_debug_using_to_str!(MediaFileOriginProductCategory);
impl_mysql_enum_coders!(MediaFileOriginProductCategory);
impl_mysql_from_row!(MediaFileOriginProductCategory);

/// NB: Legacy API for older code.
impl MediaFileOriginProductCategory {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::Unknown => "unknown",
      Self::FaceAnimator => "face_animator",
      Self::FaceFusion => "face_fusion",
      Self::FaceMirror => "face_mirror",
      Self::VideoStyleTransfer => "vst",
      Self::ImageStudio => "image_studio",
      Self::StorytellerStudio => "studio",
      Self::TextToSpeech => "tts",
      Self::VoiceConversion => "voice_conversion",
      Self::ZeroShotVoice => "zs_voice",
      Self::Mocap => "mocap",
      Self::ImageGeneration => "image_gen",
      Self::VideoGeneration => "video_gen",
      Self::WorldGeneration => "world_gen",
      Self::VideoFilter => "video_filter",
      Self::Workflow => "workflow",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "unknown" => Ok(Self::Unknown),
      "face_animator" => Ok(Self::FaceAnimator),
      "face_fusion" => Ok(Self::FaceFusion),
      "face_mirror" => Ok(Self::FaceMirror),
      "vst" => Ok(Self::VideoStyleTransfer),
      "image_studio" => Ok(Self::ImageStudio),
      "studio" => Ok(Self::StorytellerStudio),
      "tts" => Ok(Self::TextToSpeech),
      "voice_conversion" => Ok(Self::VoiceConversion),
      "zs_voice" => Ok(Self::ZeroShotVoice),
      "mocap" => Ok(Self::Mocap),
      "image_gen" => Ok(Self::ImageGeneration),
      "video_gen" => Ok(Self::VideoGeneration),
      "world_gen" => Ok(Self::WorldGeneration),
      "video_filter" => Ok(Self::VideoFilter),
      "workflow" => Ok(Self::Workflow),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }

}

#[cfg(test)]
mod tests {
  use super::super::media_file_origin_product_category::MediaFileOriginProductCategory;
  use enums_shared::test_helpers::assert_serialization;

  mod explicit_checks {
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
    fn to_str() {
      assert_eq!(MediaFileOriginProductCategory::Unknown.to_str(), "unknown");
      assert_eq!(MediaFileOriginProductCategory::FaceAnimator.to_str(), "face_animator");
      assert_eq!(MediaFileOriginProductCategory::FaceFusion.to_str(), "face_fusion");
      assert_eq!(MediaFileOriginProductCategory::FaceMirror.to_str(), "face_mirror");
      assert_eq!(MediaFileOriginProductCategory::VideoStyleTransfer.to_str(), "vst");
      assert_eq!(MediaFileOriginProductCategory::ImageStudio.to_str(), "image_studio");
      assert_eq!(MediaFileOriginProductCategory::StorytellerStudio.to_str(), "studio");
      assert_eq!(MediaFileOriginProductCategory::TextToSpeech.to_str(), "tts");
      assert_eq!(MediaFileOriginProductCategory::VoiceConversion.to_str(), "voice_conversion");
      assert_eq!(MediaFileOriginProductCategory::ZeroShotVoice.to_str(), "zs_voice");
      assert_eq!(MediaFileOriginProductCategory::Mocap.to_str(), "mocap");
      assert_eq!(MediaFileOriginProductCategory::ImageGeneration.to_str(), "image_gen");
      assert_eq!(MediaFileOriginProductCategory::VideoGeneration.to_str(), "video_gen");
      assert_eq!(MediaFileOriginProductCategory::WorldGeneration.to_str(), "world_gen");
      assert_eq!(MediaFileOriginProductCategory::VideoFilter.to_str(), "video_filter");
      assert_eq!(MediaFileOriginProductCategory::Workflow.to_str(), "workflow");
    }

    #[test]
    fn from_str() {
      assert_eq!(MediaFileOriginProductCategory::from_str("unknown").unwrap(), MediaFileOriginProductCategory::Unknown);
      assert_eq!(MediaFileOriginProductCategory::from_str("face_animator").unwrap(), MediaFileOriginProductCategory::FaceAnimator);
      assert_eq!(MediaFileOriginProductCategory::from_str("face_fusion").unwrap(), MediaFileOriginProductCategory::FaceFusion);
      assert_eq!(MediaFileOriginProductCategory::from_str("face_mirror").unwrap(), MediaFileOriginProductCategory::FaceMirror);
      assert_eq!(MediaFileOriginProductCategory::from_str("vst").unwrap(), MediaFileOriginProductCategory::VideoStyleTransfer);
      assert_eq!(MediaFileOriginProductCategory::from_str("image_studio").unwrap(), MediaFileOriginProductCategory::ImageStudio);
      assert_eq!(MediaFileOriginProductCategory::from_str("studio").unwrap(), MediaFileOriginProductCategory::StorytellerStudio);
      assert_eq!(MediaFileOriginProductCategory::from_str("tts").unwrap(), MediaFileOriginProductCategory::TextToSpeech);
      assert_eq!(MediaFileOriginProductCategory::from_str("voice_conversion").unwrap(), MediaFileOriginProductCategory::VoiceConversion);
      assert_eq!(MediaFileOriginProductCategory::from_str("zs_voice").unwrap(), MediaFileOriginProductCategory::ZeroShotVoice);
      assert_eq!(MediaFileOriginProductCategory::from_str("mocap").unwrap(), MediaFileOriginProductCategory::Mocap);
      assert_eq!(MediaFileOriginProductCategory::from_str("image_gen").unwrap(),MediaFileOriginProductCategory::ImageGeneration);
      assert_eq!(MediaFileOriginProductCategory::from_str("video_gen").unwrap(), MediaFileOriginProductCategory::VideoGeneration);
      assert_eq!(MediaFileOriginProductCategory::from_str("world_gen").unwrap(), MediaFileOriginProductCategory::WorldGeneration);
      assert_eq!(MediaFileOriginProductCategory::from_str("video_filter").unwrap(), MediaFileOriginProductCategory::VideoFilter);
      assert_eq!(MediaFileOriginProductCategory::from_str("workflow").unwrap(), MediaFileOriginProductCategory::Workflow);
    }

  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip() {
      use strum::IntoEnumIterator;
      for variant in MediaFileOriginProductCategory::iter() {
        assert_eq!(variant, MediaFileOriginProductCategory::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, MediaFileOriginProductCategory::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, MediaFileOriginProductCategory::from_str(&format!("{:?}", variant)).unwrap());
      }
    }

    #[test]
    fn serialized_length_ok_for_database() {
      use strum::IntoEnumIterator;
      const MAX_LENGTH : usize = 16;
      for variant in MediaFileOriginProductCategory::iter() {
        let serialized = variant.to_str();
        assert!(serialized.len() > 0, "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long", variant);
      }
    }
  }
}
