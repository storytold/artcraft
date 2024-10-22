use std::collections::BTreeSet;

#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;

/// Used in the `generic_inference_jobs` table in `VARCHAR(32)` field `job_type`.
///
/// TODO(bt,2024-02-01): This will replace "inference_category" and "maybe_model_type" for job control and dispatch,
/// since those mechanisms are overloaded and inconsistent.
///
/// YOU CAN ADD NEW VALUES, BUT DO NOT CHANGE EXISTING VALUES WITHOUT A MIGRATION STRATEGY.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize, Default)]
#[serde(rename_all = "snake_case")]
pub enum InferenceJobType {
  /// Storyteller Studio and Video Style Transfer Jobs (which we may want to split).
  /// These run in Comfy.
  /// TODO(bt,2024-07-15): We may segregate these two job types in the future
  VideoRender,

  /// Live Portrait Jobs.
  /// These run in Comfy.
  LivePortrait,

  /// Face Fusion Jobs.
  /// These run in Comfy.
  FaceFusion,

  /// Voice jobs that use GPT-Sovits
  GptSovits,

  /// Jobs that run ComfyUI workflows
  /// This is actually just for Video Style Transfer and Storyteller Studio.
  #[deprecated(note = "Use VideoRender instead.")]
  ComfyUi,

  /// A job that turns "FBX" game engine files into "GLTF" files (Bevy-compatible).
  #[serde(rename = "convert_fbx_gltf")]
  ConvertFbxToGltf,

  /// Process a video into BVH mocap animation data for game engines
  MocapNet,

  /// Jobs that run F5TTS
  #[serde(rename = "f5_tts")]
  F5TTS,

  /// RVC is a voice conversion model. RVCv2 is the most popular such model currently.
  #[serde(rename = "rvc_v2")]
  RvcV2,

  /// SadTalker does image-to-video lip-syncing when given an audio file and image.
  SadTalker,

  /// so-vits-svc voice conversion. This predates RVCv2.
  SoVitsSvc,

  #[serde(rename = "seed_vc")]
  SeedVc,

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

// TODO(bt, 2022-12-21): This desperately needs MySQL integration tests!
impl_enum_display_and_debug_using_to_str!(InferenceJobType);
impl_mysql_enum_coders!(InferenceJobType);

/// NB: Legacy API for older code.
impl InferenceJobType {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::VideoRender => "video_render",
      Self::LivePortrait => "live_portrait",
      Self::FaceFusion => "face_fusion",
      Self::F5TTS => "f5_tts",
      Self::GptSovits => "gpt_sovits",
      Self::ComfyUi => "comfy_ui",
      Self::ConvertFbxToGltf => "convert_fbx_gltf",
      Self::MocapNet => "mocap_net",
      Self::RvcV2 => "rvc_v2",
      Self::SadTalker => "sad_talker",
      Self::SeedVc => "seed_vc",
      Self::SoVitsSvc => "so_vits_svc",
      Self::StableDiffusion => "stable_diffusion",
      Self::StyleTTS2 => "styletts2",
      Self::Tacotron2 => "tacotron2",
      Self::Unknown => "unknown",
      Self::BevyToWorkflow => "bevy_to_workflow",
      Self::RerenderAVideo => "rerender_a_video",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "video_render" => Ok(Self::VideoRender),
      "live_portrait" => Ok(Self::LivePortrait),
      "face_fusion" => Ok(Self::FaceFusion),
      "f5_tts" => Ok(Self::F5TTS),
      "gpt_sovits" => Ok(Self::GptSovits),
      "comfy_ui" => Ok(Self::ComfyUi),
      "convert_fbx_gltf" => Ok(Self::ConvertFbxToGltf),
      "mocap_net" => Ok(Self::MocapNet),
      "rvc_v2" => Ok(Self::RvcV2),
      "sad_talker" => Ok(Self::SadTalker),
      "seed_vc" => Ok(Self::SeedVc),
      "so_vits_svc" => Ok(Self::SoVitsSvc),
      "stable_diffusion" => Ok(Self::StableDiffusion),
      "styletts2" => Ok(Self::StyleTTS2),
      "tacotron2" => Ok(Self::Tacotron2),
      "unknown" => Ok(Self::Unknown),
      "bevy_to_workflow" => Ok(Self::BevyToWorkflow),
      "rerender_a_video" => Ok(Self::RerenderAVideo),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    // NB: BTreeSet is sorted
    // NB: BTreeSet::from() isn't const, but not worth using LazyStatic, etc.
    BTreeSet::from([
      Self::VideoRender,
      Self::LivePortrait,
      Self::FaceFusion,
      Self::F5TTS,
      Self::GptSovits,
      Self::ComfyUi,
      Self::ConvertFbxToGltf,
      Self::MocapNet,
      Self::RvcV2,
      Self::SadTalker,
      Self::SeedVc,
      Self::SoVitsSvc,
      Self::StableDiffusion,
      Self::StyleTTS2,
      Self::Tacotron2,
      Self::Unknown,
      Self::BevyToWorkflow,
      Self::RerenderAVideo,
    ])
  }
}

#[cfg(test)]
mod tests {
  use crate::by_table::generic_inference_jobs::inference_job_type::InferenceJobType;
  use crate::test_helpers::assert_serialization;

  mod explicit_checks {
    use super::*;

    #[test]
    fn default() {
      assert_eq!(InferenceJobType::default(), InferenceJobType::Unknown);
    }

    #[test]
    fn test_serialization() {
      assert_serialization(InferenceJobType::VideoRender, "video_render");
      assert_serialization(InferenceJobType::LivePortrait, "live_portrait");
      assert_serialization(InferenceJobType::FaceFusion, "face_fusion");
      assert_serialization(InferenceJobType::F5TTS, "f5_tts");
      assert_serialization(InferenceJobType::GptSovits, "gpt_sovits");
      assert_serialization(InferenceJobType::ComfyUi, "comfy_ui");
      assert_serialization(InferenceJobType::ConvertFbxToGltf, "convert_fbx_gltf");
      assert_serialization(InferenceJobType::MocapNet, "mocap_net");
      assert_serialization(InferenceJobType::RvcV2, "rvc_v2");
      assert_serialization(InferenceJobType::SadTalker, "sad_talker");
      assert_serialization(InferenceJobType::SeedVc, "seed_vc");
      assert_serialization(InferenceJobType::SoVitsSvc, "so_vits_svc");
      assert_serialization(InferenceJobType::StableDiffusion, "stable_diffusion");
      assert_serialization(InferenceJobType::StyleTTS2, "styletts2");
      assert_serialization(InferenceJobType::Tacotron2, "tacotron2");
      assert_serialization(InferenceJobType::Unknown, "unknown");
      assert_serialization(InferenceJobType::BevyToWorkflow, "bevy_to_workflow");
      assert_serialization(InferenceJobType::RerenderAVideo, "rerender_a_video");
    }

    #[test]
    fn to_str() {
      assert_eq!(InferenceJobType::VideoRender.to_str(), "video_render");
      assert_eq!(InferenceJobType::LivePortrait.to_str(), "live_portrait");
      assert_eq!(InferenceJobType::FaceFusion.to_str(), "face_fusion");
      assert_eq!(InferenceJobType::F5TTS.to_str(), "f5_tts");
      assert_eq!(InferenceJobType::GptSovits.to_str(), "gpt_sovits");
      assert_eq!(InferenceJobType::ComfyUi.to_str(), "comfy_ui");
      assert_eq!(InferenceJobType::ConvertFbxToGltf.to_str(), "convert_fbx_gltf");
      assert_eq!(InferenceJobType::MocapNet.to_str(), "mocap_net");
      assert_eq!(InferenceJobType::RvcV2.to_str(), "rvc_v2");
      assert_eq!(InferenceJobType::SadTalker.to_str(), "sad_talker");
      assert_eq!(InferenceJobType::SeedVc.to_str(), "seed_vc");
      assert_eq!(InferenceJobType::SoVitsSvc.to_str(), "so_vits_svc");
      assert_eq!(InferenceJobType::StableDiffusion.to_str(), "stable_diffusion");
      assert_eq!(InferenceJobType::StyleTTS2.to_str(), "styletts2");
      assert_eq!(InferenceJobType::Tacotron2.to_str(), "tacotron2");
      assert_eq!(InferenceJobType::Unknown.to_str(), "unknown");
      assert_eq!(InferenceJobType::BevyToWorkflow.to_str(), "bevy_to_workflow");
      assert_eq!(InferenceJobType::RerenderAVideo.to_str(), "rerender_a_video");
    }

    #[test]
    fn from_str() {
      assert_eq!(InferenceJobType::from_str("video_render").unwrap(), InferenceJobType::VideoRender);
      assert_eq!(InferenceJobType::from_str("live_portrait").unwrap(), InferenceJobType::LivePortrait);
      assert_eq!(InferenceJobType::from_str("face_fusion").unwrap(), InferenceJobType::FaceFusion);
      assert_eq!(InferenceJobType::from_str("f5_tts").unwrap(), InferenceJobType::F5TTS);
      assert_eq!(InferenceJobType::from_str("gpt_sovits").unwrap(), InferenceJobType::GptSovits);
      assert_eq!(InferenceJobType::from_str("comfy_ui").unwrap(), InferenceJobType::ComfyUi);
      assert_eq!(InferenceJobType::from_str("convert_fbx_gltf").unwrap(), InferenceJobType::ConvertFbxToGltf);
      assert_eq!(InferenceJobType::from_str("mocap_net").unwrap(), InferenceJobType::MocapNet);
      assert_eq!(InferenceJobType::from_str("rvc_v2").unwrap(), InferenceJobType::RvcV2);
      assert_eq!(InferenceJobType::from_str("sad_talker").unwrap(), InferenceJobType::SadTalker);
      assert_eq!(InferenceJobType::from_str("seed_vc").unwrap(), InferenceJobType::SeedVc);
      assert_eq!(InferenceJobType::from_str("so_vits_svc").unwrap(), InferenceJobType::SoVitsSvc);
      assert_eq!(InferenceJobType::from_str("stable_diffusion").unwrap(), InferenceJobType::StableDiffusion);
      assert_eq!(InferenceJobType::from_str("styletts2").unwrap(), InferenceJobType::StyleTTS2);
      assert_eq!(InferenceJobType::from_str("tacotron2").unwrap(), InferenceJobType::Tacotron2);
      assert_eq!(InferenceJobType::from_str("unknown").unwrap(), InferenceJobType::Unknown);
      assert_eq!(InferenceJobType::from_str("bevy_to_workflow").unwrap(), InferenceJobType::BevyToWorkflow);
      assert_eq!(InferenceJobType::from_str("rerender_a_video").unwrap(), InferenceJobType::RerenderAVideo);
    }

    #[test]
    fn all_variants() {
      // Static check
      let mut variants = InferenceJobType::all_variants();
      assert_eq!(variants.len(), 16);
      assert_eq!(variants.pop_first(), Some(InferenceJobType::VideoRender));
      assert_eq!(variants.pop_first(), Some(InferenceJobType::LivePortrait));
      assert_eq!(variants.pop_first(), Some(InferenceJobType::FaceFusion));
      assert_eq!(variants.pop_first(), Some(InferenceJobType::F5TTS));
      assert_eq!(variants.pop_first(), Some(InferenceJobType::GptSovits));
      assert_eq!(variants.pop_first(), Some(InferenceJobType::ComfyUi));
      assert_eq!(variants.pop_first(), Some(InferenceJobType::ConvertFbxToGltf));
      assert_eq!(variants.pop_first(), Some(InferenceJobType::MocapNet));
      assert_eq!(variants.pop_first(), Some(InferenceJobType::RvcV2));
      assert_eq!(variants.pop_first(), Some(InferenceJobType::SadTalker));
      assert_eq!(variants.pop_first(), Some(InferenceJobType::SeedVc));
      assert_eq!(variants.pop_first(), Some(InferenceJobType::SoVitsSvc));
      assert_eq!(variants.pop_first(), Some(InferenceJobType::StableDiffusion));
      assert_eq!(variants.pop_first(), Some(InferenceJobType::StyleTTS2));
      assert_eq!(variants.pop_first(), Some(InferenceJobType::Tacotron2));
      assert_eq!(variants.pop_first(), Some(InferenceJobType::Unknown));
      assert_eq!(variants.pop_first(), Some(InferenceJobType::BevyToWorkflow));
      assert_eq!(variants.pop_first(), Some(InferenceJobType::RerenderAVideo));
      assert_eq!(variants.pop_first(), None);

      // Generated check
      use strum::IntoEnumIterator;
      assert_eq!(InferenceJobType::all_variants().len(), InferenceJobType::iter().len());
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn variant_length() {
      use strum::IntoEnumIterator;
      assert_eq!(InferenceJobType::all_variants().len(), InferenceJobType::iter().len());
    }

    #[test]
    fn round_trip() {
      for variant in InferenceJobType::all_variants() {
        assert_eq!(variant, InferenceJobType::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, InferenceJobType::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, InferenceJobType::from_str(&format!("{:?}", variant)).unwrap());
      }
    }

    #[test]
    fn serialized_length_ok_for_database() {
      const MAX_LENGTH : usize = 32;
      for variant in InferenceJobType::all_variants() {
        let serialized = variant.to_str();
        assert!(serialized.len() > 0, "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long", variant);
      }
    }
  }
}
