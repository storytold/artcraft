use std::collections::BTreeSet;

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

/// NB: Legacy API for older code.
impl InferenceCategory {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::DeprecatedField => "deprecated_field",
      Self::LipsyncAnimation => "lipsync_animation",
      Self::TextToSpeech => "text_to_speech",
      Self::VoiceConversion => "voice_conversion",
      Self::ImageGeneration => "image_generation",
      Self::VideoGeneration => "video_generation",
      Self::ObjectGeneration => "object_generation",
      Self::SplatGeneration => "splat_generation",
      Self::BackgroundRemoval => "background_removal",
      Self::Mocap => "mocap",
      Self::Workflow => "workflow",
      Self::F5TTS => "f5_tts",
      Self::FormatConversion => "format_conversion",
      Self::LivePortrait => "live_portrait",
      Self::SeedVc => "seed_vc",
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
      "video_generation" => Ok(Self::VideoGeneration),
      "object_generation" => Ok(Self::ObjectGeneration),
      "splat_generation" => Ok(Self::SplatGeneration),
      "background_removal" => Ok(Self::BackgroundRemoval),
      "f5_tts" => Ok(Self::F5TTS),
      "mocap" => Ok(Self::Mocap),
      "workflow" => Ok(Self::Workflow),
      "format_conversion" => Ok(Self::FormatConversion),
      "live_portrait" => Ok(Self::LivePortrait),
      "seed_vc" => Ok(Self::SeedVc),
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
      Self::ObjectGeneration,
      Self::SplatGeneration,
      Self::VideoGeneration,
      Self::BackgroundRemoval,
      Self::Mocap,
      Self::F5TTS,
      Self::SeedVc,
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
  use super::InferenceCategory;
  use strum::IntoEnumIterator;

  #[test]
  fn round_trip_json() {
    for variant in InferenceCategory::iter() {
      let json = serde_json::to_string(&variant).unwrap();
      let back: InferenceCategory = serde_json::from_str(&json).unwrap();
      assert_eq!(variant, back);
    }
  }
}
