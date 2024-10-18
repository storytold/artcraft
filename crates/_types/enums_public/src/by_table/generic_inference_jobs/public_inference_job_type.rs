#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;
use utoipa::ToSchema;

use enums::by_table::generic_inference_jobs::inference_job_type::InferenceJobType;

/// Report certain jobs publicly as different from what we actually run.
/// This is so we have an edge against the competition that might try to run
/// the same models or workflows. This won't always make sense, but in some cases it will.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize, Default, ToSchema, Debug)]
#[serde(rename_all = "snake_case")]
pub enum PublicInferenceJobType {

  // ======= Renamed enum variants  ======

  /// Instead of `InferenceJobType::LivePortrait` ("live_portrait")
  /// This is not necessary anymore since we call the product "live portrait" in production
  ActingFace,

  /// Instead of `InferenceJobType::FaceFusion` ("face_fusion")
  Lipsync,

  /// Storyteller Studio and Video Style Transfer Jobs (which we may want to split).
  /// These run in Comfy.
  /// TODO(bt,2024-07-15): We may segregate these two job types in the future
  VideoRender,

  GptSovits,

  #[serde(rename = "f5_tts")]
  F5TTS,
  // ======= Everything else is the same =======

  /// Jobs that run ComfyUI workflows
  /// This is actually just for Video Style Transfer and Storyteller Studio.
  #[deprecated(note = "Use VideoRender instead.")]
  ComfyUi,

  /// A job that turns "FBX" game engine files into "GLTF" files (Bevy-compatible).
  #[serde(rename = "convert_fbx_gltf")]
  ConvertFbxToGltf,

  /// Process a video into BVH mocap animation data for game engines
  MocapNet,

  /// RVC is a voice conversion model. RVCv2 is the most popular such model currently.
  #[serde(rename = "rvc_v2")]
  RvcV2,

  /// SadTalker does image-to-video lip-syncing when given an audio file and image.
  SadTalker,

  /// so-vits-svc voice conversion. This predates RVCv2.
  SoVitsSvc,

  /// Stable diffusion image generation
  StableDiffusion,

  /// StyleTTS2 is a zero shot multi-speaker TTS model.
  /// This job type should handle both speaker vector encoding and inference.
  #[serde(rename = "styletts2")]
  StyleTTS2,

  /// TT2 Text to speech
  Tacotron2,

  /// A value we may use in the future for historical jobs
  /// (i.e. when we backfill the database column and make it non-nullable)
  #[default]
  Unknown,

  /// DEPRECATED. DO NOT USE.
  /// Job that converts bevy to workflow files
  #[deprecated(note = "This was for Bevy engine's server side rendering.")]
  #[serde(rename = "bevy_to_workflow")]
  BevyToWorkflow,

  #[deprecated(note = "This was for ReRenderAVideo, which we never productionized.")]
  /// DEPRECATED. DO NOT USE.
  /// Re-render a video is a video style transfer algorithm. We developed code
  /// around it, but chose to develop AnimateDiff / ComfyUI support instead.
  RerenderAVideo,
}

/// NB: Legacy API for older code.
impl PublicInferenceJobType {
  
  pub fn from_enum(inference_job_type: InferenceJobType) -> Self {
    match inference_job_type {
      // Renamed variants
      InferenceJobType::LivePortrait => Self::ActingFace,
      InferenceJobType::FaceFusion => Self::Lipsync,
      // Conserved variants
      InferenceJobType::VideoRender => Self::VideoRender,
      InferenceJobType::GptSovits => Self::GptSovits,
      InferenceJobType::F5TTS => Self::F5TTS,
      InferenceJobType::ComfyUi => Self::ComfyUi,
      InferenceJobType::ConvertFbxToGltf => Self::ConvertFbxToGltf,
      InferenceJobType::MocapNet => Self::MocapNet,
      InferenceJobType::RvcV2 => Self::RvcV2,
      InferenceJobType::SadTalker => Self::SadTalker,
      InferenceJobType::SoVitsSvc => Self::SoVitsSvc,
      InferenceJobType::StableDiffusion => Self::StableDiffusion,
      InferenceJobType::StyleTTS2 => Self::StyleTTS2,
      InferenceJobType::Tacotron2 => Self::Tacotron2,
      InferenceJobType::Unknown => Self::Unknown,
      InferenceJobType::BevyToWorkflow => Self::BevyToWorkflow,
      InferenceJobType::RerenderAVideo => Self::RerenderAVideo,
    }
  }
  
  pub fn to_enum(&self) -> InferenceJobType {
    match self {
      // Renamed variants
      Self::ActingFace => InferenceJobType::LivePortrait,
      Self::Lipsync => InferenceJobType::FaceFusion,
      // Conserved variants
      Self::VideoRender => InferenceJobType::VideoRender,
      Self::GptSovits => InferenceJobType::GptSovits,
      Self::F5TTS => InferenceJobType::F5TTS,
      Self::ComfyUi => InferenceJobType::ComfyUi,
      Self::ConvertFbxToGltf => InferenceJobType::ConvertFbxToGltf,
      Self::MocapNet => InferenceJobType::MocapNet,
      Self::RvcV2 => InferenceJobType::RvcV2,
      Self::SadTalker => InferenceJobType::SadTalker,
      Self::SoVitsSvc => InferenceJobType::SoVitsSvc,
      Self::StableDiffusion => InferenceJobType::StableDiffusion,
      Self::StyleTTS2 => InferenceJobType::StyleTTS2,
      Self::Tacotron2 => InferenceJobType::Tacotron2,
      Self::Unknown => InferenceJobType::Unknown,
      Self::BevyToWorkflow => InferenceJobType::BevyToWorkflow,
      Self::RerenderAVideo => InferenceJobType::RerenderAVideo,
    }
  }
}

#[cfg(test)]
mod tests {
  use strum::IntoEnumIterator;

  use crate::test_helpers::to_json;

  use super::*;

  fn override_enums() -> &'static [PublicInferenceJobType; 2] {
    &[
      PublicInferenceJobType::ActingFace,
      PublicInferenceJobType::Lipsync,
    ]
  }

  mod override_values {
    use super::*;

    #[test]
    fn acting_face() {
      // Public --> Internal
      assert_eq!(PublicInferenceJobType::ActingFace.to_enum(), InferenceJobType::LivePortrait);
      assert_eq!(to_json(&PublicInferenceJobType::ActingFace.to_enum()), "live_portrait");

      // Internal --> Public
      assert_eq!(PublicInferenceJobType::from_enum(InferenceJobType::LivePortrait), PublicInferenceJobType::ActingFace);
      assert_eq!(to_json(&PublicInferenceJobType::from_enum(InferenceJobType::LivePortrait)), "acting_face");
    }

    #[test]
    fn lipsync() {
      // Public --> Internal
      assert_eq!(PublicInferenceJobType::Lipsync.to_enum(), InferenceJobType::FaceFusion);
      assert_eq!(to_json(&PublicInferenceJobType::Lipsync.to_enum()), "face_fusion");

      // Internal --> Public
      assert_eq!(PublicInferenceJobType::from_enum(InferenceJobType::FaceFusion), PublicInferenceJobType::Lipsync);
      assert_eq!(to_json(&PublicInferenceJobType::from_enum(InferenceJobType::FaceFusion)), "lipsync");
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn public_to_internal() {
      let mut tested_count = 0;

      for public_variant in PublicInferenceJobType::iter() {
        match public_variant {
          PublicInferenceJobType::ActingFace |
          PublicInferenceJobType::Lipsync => continue, // Can't compare
          _ => {}
        }

        // Round trip
        assert_eq!(public_variant, PublicInferenceJobType::from_enum(public_variant.to_enum()));

        let internal_enum_variant = public_variant.to_enum();
        let internal_enum_string = to_json(&internal_enum_variant);
        let public_enum_string = to_json(&public_variant);

        assert_eq!(internal_enum_string, public_enum_string);

        tested_count += 1;
      }

      assert!(tested_count > 1);
      assert_eq!(tested_count, PublicInferenceJobType::iter().len() - override_enums().len());
    }

    #[test]
    fn internal_to_public() {
      let mut tested_count = 0;

      for internal_variant in InferenceJobType::all_variants() {
        match internal_variant {
          InferenceJobType::LivePortrait |
          InferenceJobType::FaceFusion => continue, // Can't compare
          _ => {}
        }

        // Round trip
        assert_eq!(internal_variant, PublicInferenceJobType::from_enum(internal_variant).to_enum());

        let public_enum_variant = PublicInferenceJobType::from_enum(internal_variant);
        let public_enum_string = to_json(&public_enum_variant);
        let internal_enum_string = to_json(&internal_variant);

        // Same serialization
        assert_eq!(internal_enum_string, public_enum_string);

        tested_count += 1;
      }

      assert!(tested_count > 1);
      assert_eq!(tested_count, InferenceJobType::all_variants().len() - override_enums().len());
    }
  }
}
