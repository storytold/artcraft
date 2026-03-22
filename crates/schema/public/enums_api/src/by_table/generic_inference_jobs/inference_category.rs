use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `generic_inference_jobs` table in `VARCHAR(32)` field `inference_category`.
///
/// Our "generic inference" pipeline supports a wide variety of ML models and other media.
/// Each "category" of inference is identified by the following enum variants.
/// These types are present in the HTTP API and database columns as serialized here.
///
/// YOU CAN ADD NEW VALUES, BUT DO NOT CHANGE EXISTING VALUES WITHOUT A MIGRATION STRATEGY.
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize, Default, ToSchema, EnumIter, Debug)]

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

  /// Image generation (eg. Stable Diffusion 1.5), FAL-powered image generation, etc.
  #[serde(rename = "image_generation")]
  ImageGeneration,

  /// FAL-powered video generation
  /// (Also Seedance2-Pro.com)
  #[serde(rename = "video_generation")]
  VideoGeneration,
  
  /// FAL-powered 3D object generation
  #[serde(rename = "object_generation")]
  ObjectGeneration,

  /// Gaussian Splat generation (eg. World Labs Marble)
  #[serde(rename = "splat_generation")]
  SplatGeneration,

  /// FAL-powered image background removal
  #[serde(rename = "background_removal")]
  BackgroundRemoval,

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

  #[serde(rename="seed_vc")]
  SeedVc,

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

#[cfg(test)]
mod tests {
  use super::InferenceCategory;
  use enums_shared::test_helpers::{assert_deserialization, assert_serialization};
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(InferenceCategory::DeprecatedField, "deprecated_field");
      assert_serialization(InferenceCategory::LipsyncAnimation, "lipsync_animation");
      assert_serialization(InferenceCategory::TextToSpeech, "text_to_speech");
      assert_serialization(InferenceCategory::VoiceConversion, "voice_conversion");
      assert_serialization(InferenceCategory::ImageGeneration, "image_generation");
      assert_serialization(InferenceCategory::VideoGeneration, "video_generation");
      assert_serialization(InferenceCategory::ObjectGeneration, "object_generation");
      assert_serialization(InferenceCategory::SplatGeneration, "splat_generation");
      assert_serialization(InferenceCategory::BackgroundRemoval, "background_removal");
      assert_serialization(InferenceCategory::Mocap, "mocap");
      assert_serialization(InferenceCategory::Workflow, "workflow");
      assert_serialization(InferenceCategory::FormatConversion, "format_conversion");
      assert_serialization(InferenceCategory::LivePortrait, "live_portrait");
      assert_serialization(InferenceCategory::SeedVc, "seed_vc");
      assert_serialization(InferenceCategory::VideoFilter, "video_filter");
      assert_serialization(InferenceCategory::ConvertBvhToWorkflow, "convert_bvh_to_workflow");
      assert_serialization(InferenceCategory::F5TTS, "f5_tts");
    }

    #[test]
    fn test_deserialization() {
      assert_deserialization("deprecated_field", InferenceCategory::DeprecatedField);
      assert_deserialization("lipsync_animation", InferenceCategory::LipsyncAnimation);
      assert_deserialization("text_to_speech", InferenceCategory::TextToSpeech);
      assert_deserialization("voice_conversion", InferenceCategory::VoiceConversion);
      assert_deserialization("image_generation", InferenceCategory::ImageGeneration);
      assert_deserialization("video_generation", InferenceCategory::VideoGeneration);
      assert_deserialization("object_generation", InferenceCategory::ObjectGeneration);
      assert_deserialization("splat_generation", InferenceCategory::SplatGeneration);
      assert_deserialization("background_removal", InferenceCategory::BackgroundRemoval);
      assert_deserialization("mocap", InferenceCategory::Mocap);
      assert_deserialization("workflow", InferenceCategory::Workflow);
      assert_deserialization("format_conversion", InferenceCategory::FormatConversion);
      assert_deserialization("live_portrait", InferenceCategory::LivePortrait);
      assert_deserialization("seed_vc", InferenceCategory::SeedVc);
      assert_deserialization("video_filter", InferenceCategory::VideoFilter);
      assert_deserialization("convert_bvh_to_workflow", InferenceCategory::ConvertBvhToWorkflow);
      assert_deserialization("f5_tts", InferenceCategory::F5TTS);
    }

    #[test]
    fn variants_count_check() {
      assert_eq!(InferenceCategory::iter().count(), 17);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in InferenceCategory::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: InferenceCategory = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
