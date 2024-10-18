use std::collections::BTreeSet;

#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `generic_inference_jobs` table in `VARCHAR(32)` field `inference_category`.
///
/// Our "generic inference" pipeline supports a wide variety of ML models and other media.
/// Each "category" of inference is identified by the following enum variants.
/// These types are present in the HTTP API and database columns as serialized here.
///
/// YOU CAN ADD NEW VALUES, BUT DO NOT CHANGE EXISTING VALUES WITHOUT A MIGRATION STRATEGY.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize, Default, ToSchema)]
pub enum InferenceCategory {
  /// Deprecate this field !!!
  /// We should drain all jobs from using this database field, then remove it.
  #[deprecated(note = "NB(bt,2024-09-05): The frontend still needs this")]
  #[serde(rename = "deprecated_field")]
  DeprecatedField,

  /// Facial lipsync animation (eg. SadTalker, Wav2Lip, FaceFusion)
  #[serde(rename = "lipsync_animation")]
  #[default]
  LipsyncAnimation,

  /// FakeYou's text to speech (eg. Tacotron2)
  #[serde(rename = "text_to_speech")]
  TextToSpeech,

  /// FakeYou's voice conversion (eg. svc, rvc)
  #[serde(rename = "voice_conversion")]
  VoiceConversion,

  /// Image generation (eg. Stable Diffusion 1.5)
  #[serde(rename = "image_generation")]
  ImageGeneration,

  /// Turn video into animation data with mocap processing (eg. Mocapnet).
  #[serde(rename = "mocap")]
  Mocap,

  /// ComfyUI workflows
  /// This is what powers Storyteller Studio!
  #[serde(rename = "workflow")]
  Workflow,

  /// FBX to GLTF/GLB.
  /// Still supported, but few people will use it.
  #[serde(rename = "format_conversion")]
  FormatConversion,

  /// Live portrait
  #[serde(rename = "live_portrait")]
  LivePortrait,

  /// DEPRECATED. Do not use.
  /// This was for ReRenderAVideo, which we never productionized.
  #[deprecated(note = "This was for ReRenderAVideo, which we never productionized.")]
  #[serde(rename = "video_filter")]
  VideoFilter,

  /// DEPRECATED. Bevy engine serverside rendering.
  #[deprecated(note = "This was for Bevy engine's server side rendering.")]
  #[serde(rename = "convert_bvh_to_workflow")]
  ConvertBvhToWorkflow,

  #[serde(rename = "f5_tts")]
  F5TTS,
}

// TODO(bt, 2022-12-21): This desperately needs MySQL integration tests!
impl_enum_display_and_debug_using_to_str!(InferenceCategory);
impl_mysql_enum_coders!(InferenceCategory);
impl_mysql_from_row!(InferenceCategory);

/// NB: Legacy API for older code.
impl InferenceCategory {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::DeprecatedField => "deprecated_field",
      Self::LipsyncAnimation => "lipsync_animation",
      Self::TextToSpeech => "text_to_speech",
      Self::VoiceConversion => "voice_conversion",
      Self::ImageGeneration => "image_generation",
      Self::Mocap => "mocap",
      Self::Workflow => "workflow",
      Self::F5TTS => "f5_tts",
      Self::FormatConversion => "format_conversion",
      Self::LivePortrait => "live_portrait",
      Self::VideoFilter => "video_filter",
      Self::ConvertBvhToWorkflow => "convert_bvh_to_workflow",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "deprecated_field" => Ok(Self::DeprecatedField),
      "lipsync_animation" => Ok(Self::LipsyncAnimation),
      "text_to_speech" => Ok(Self::TextToSpeech),
      "voice_conversion" => Ok(Self::VoiceConversion),
      "image_generation" => Ok(Self::ImageGeneration),
      "f5_tts" => Ok(Self::F5TTS),
      "mocap" => Ok(Self::Mocap),
      "workflow" => Ok(Self::Workflow),
      "format_conversion" => Ok(Self::FormatConversion),
      "live_portrait" => Ok(Self::LivePortrait),
      "video_filter" => Ok(Self::VideoFilter),
      "convert_bvh_to_workflow" => Ok(Self::ConvertBvhToWorkflow),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    // NB: BTreeSet is sorted
    // NB: BTreeSet::from() isn't const, but not worth using LazyStatic, etc.
    BTreeSet::from([
      Self::DeprecatedField,
      Self::LipsyncAnimation,
      Self::TextToSpeech,
      Self::VoiceConversion,
      Self::ImageGeneration,
      Self::Mocap,
      Self::F5TTS,
      Self::Workflow,
      Self::FormatConversion,
      Self::LivePortrait,
      Self::VideoFilter,
      Self::ConvertBvhToWorkflow,
    ])
  }
}

#[cfg(test)]
mod tests {
  use crate::by_table::generic_inference_jobs::inference_category::InferenceCategory;
  use crate::test_helpers::assert_serialization;

  mod explicit_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(InferenceCategory::DeprecatedField, "deprecated_field");
      assert_serialization(InferenceCategory::LipsyncAnimation, "lipsync_animation");
      assert_serialization(InferenceCategory::TextToSpeech, "text_to_speech");
      assert_serialization(InferenceCategory::VoiceConversion, "voice_conversion");
      assert_serialization(InferenceCategory::ImageGeneration, "image_generation");
      assert_serialization(InferenceCategory::Mocap, "mocap");
      assert_serialization(InferenceCategory::F5TTS, "f5_tts");
      assert_serialization(InferenceCategory::Workflow, "workflow");
      assert_serialization(InferenceCategory::FormatConversion, "format_conversion");
      assert_serialization(InferenceCategory::LivePortrait, "live_portrait");
      assert_serialization(InferenceCategory::VideoFilter, "video_filter");
      assert_serialization(InferenceCategory::ConvertBvhToWorkflow, "convert_bvh_to_workflow");
    }

    #[test]
    fn to_str() {
      assert_eq!(InferenceCategory::DeprecatedField.to_str(), "deprecated_field");
      assert_eq!(InferenceCategory::LipsyncAnimation.to_str(), "lipsync_animation");
      assert_eq!(InferenceCategory::TextToSpeech.to_str(), "text_to_speech");
      assert_eq!(InferenceCategory::VoiceConversion.to_str(), "voice_conversion");
      assert_eq!(InferenceCategory::ImageGeneration.to_str(), "image_generation");
      assert_eq!(InferenceCategory::F5TTS.to_str(), "f5_tts");
      assert_eq!(InferenceCategory::Mocap.to_str(), "mocap");
      assert_eq!(InferenceCategory::Workflow.to_str(), "workflow");
      assert_eq!(InferenceCategory::FormatConversion.to_str(), "format_conversion");
      assert_eq!(InferenceCategory::LivePortrait.to_str(), "live_portrait");
      assert_eq!(InferenceCategory::VideoFilter.to_str(), "video_filter");
      assert_eq!(InferenceCategory::ConvertBvhToWorkflow.to_str(), "convert_bvh_to_workflow");
    }

    #[test]
    fn from_str() {
      assert_eq!(InferenceCategory::from_str("deprecated_field").unwrap(), InferenceCategory::DeprecatedField);
      assert_eq!(InferenceCategory::from_str("lipsync_animation").unwrap(), InferenceCategory::LipsyncAnimation);
      assert_eq!(InferenceCategory::from_str("text_to_speech").unwrap(), InferenceCategory::TextToSpeech);
      assert_eq!(InferenceCategory::from_str("voice_conversion").unwrap(), InferenceCategory::VoiceConversion);
      assert_eq!(InferenceCategory::from_str("image_generation").unwrap(), InferenceCategory::ImageGeneration);
      assert_eq!(InferenceCategory::from_str("f5_tts").unwrap(), InferenceCategory::F5TTS);
      assert_eq!(InferenceCategory::from_str("mocap").unwrap(), InferenceCategory::Mocap);
      assert_eq!(InferenceCategory::from_str("workflow").unwrap(), InferenceCategory::Workflow);
      assert_eq!(InferenceCategory::from_str("format_conversion").unwrap(), InferenceCategory::FormatConversion);
      assert_eq!(InferenceCategory::from_str("live_portrait").unwrap(), InferenceCategory::LivePortrait);
      assert_eq!(InferenceCategory::from_str("video_filter").unwrap(), InferenceCategory::VideoFilter);
      assert_eq!(InferenceCategory::from_str("convert_bvh_to_workflow").unwrap(), InferenceCategory::ConvertBvhToWorkflow);
    }

    #[test]
    fn all_variants() {
      // Static check
      let mut variants = InferenceCategory::all_variants();
      assert_eq!(variants.len(), 12);
      assert_eq!(variants.pop_first(), Some(InferenceCategory::DeprecatedField));
      assert_eq!(variants.pop_first(), Some(InferenceCategory::LipsyncAnimation));
      assert_eq!(variants.pop_first(), Some(InferenceCategory::TextToSpeech));
      assert_eq!(variants.pop_first(), Some(InferenceCategory::VoiceConversion));
      assert_eq!(variants.pop_first(), Some(InferenceCategory::ImageGeneration));
      assert_eq!(variants.pop_first(), Some(InferenceCategory::F5TTS));
      assert_eq!(variants.pop_first(), Some(InferenceCategory::Mocap));
      assert_eq!(variants.pop_first(), Some(InferenceCategory::Workflow));
      assert_eq!(variants.pop_first(), Some(InferenceCategory::FormatConversion));
      assert_eq!(variants.pop_first(), Some(InferenceCategory::LivePortrait));
      assert_eq!(variants.pop_first(), Some(InferenceCategory::VideoFilter));
      assert_eq!(variants.pop_first(), Some(InferenceCategory::ConvertBvhToWorkflow));
      assert_eq!(variants.pop_first(), None);

      // Generated check
      use strum::IntoEnumIterator;
      assert_eq!(InferenceCategory::all_variants().len(), InferenceCategory::iter().len());
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn variant_length() {
      use strum::IntoEnumIterator;
      assert_eq!(InferenceCategory::all_variants().len(), InferenceCategory::iter().len());
    }

    #[test]
    fn round_trip() {
      for variant in InferenceCategory::all_variants() {
        assert_eq!(variant, InferenceCategory::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, InferenceCategory::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, InferenceCategory::from_str(&format!("{:?}", variant)).unwrap());
      }
    }

    #[test]
    fn serialized_length_ok_for_database() {
      const MAX_LENGTH : usize = 32;
      for variant in InferenceCategory::all_variants() {
        let serialized = variant.to_str();
        assert!(serialized.len() > 0, "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long", variant);
      }
    }
  }
}
