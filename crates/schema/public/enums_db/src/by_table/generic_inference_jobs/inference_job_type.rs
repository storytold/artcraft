use strum::EnumCount;
use strum::EnumIter;

/// Used in the `generic_inference_jobs` table in `VARCHAR(32)` field `job_type`.
///
/// YOU CAN ADD NEW VALUES, BUT DO NOT CHANGE EXISTING VALUES WITHOUT A MIGRATION STRATEGY.
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize, Default, EnumIter, EnumCount)]
#[serde(rename_all = "snake_case")]
pub enum InferenceJobType {
  FalQueue,
  #[serde(rename = "seedance2pro_queue")]
  Seedance2ProQueue,
  #[serde(rename = "worldlabs_queue")]
  WorldlabsQueue,
  VideoRender,
  LivePortrait,
  FaceFusion,
  GptSovits,
  #[deprecated(note = "Use VideoRender instead.")]
  ComfyUi,
  #[serde(rename = "studio_gen2")]
  StudioGen2,
  #[serde(rename = "image_gen_api")]
  ImageGenApi,
  #[serde(rename = "convert_fbx_gltf")]
  ConvertFbxToGltf,
  MocapNet,
  #[serde(rename = "f5_tts")]
  F5TTS,
  #[serde(rename = "rvc_v2")]
  RvcV2,
  SadTalker,
  SoVitsSvc,
  #[serde(rename = "seed_vc")]
  SeedVc,
  StableDiffusion,
  #[serde(rename = "styletts2")]
  StyleTTS2,
  Tacotron2,
  #[default]
  Unknown,
  #[deprecated(note = "This was for Bevy engine's server side rendering.")]
  #[serde(rename = "bevy_to_workflow")]
  BevyToWorkflow,
  #[deprecated(note = "This was for ReRenderAVideo, which we never productionized.")]
  RerenderAVideo,
}

impl_enum_display_and_debug_using_to_str!(InferenceJobType);
impl_mysql_enum_coders!(InferenceJobType);
impl_mysql_from_row!(InferenceJobType);

impl InferenceJobType {
  pub fn all_variants() -> std::collections::BTreeSet<Self> {
    use strum::IntoEnumIterator;
    Self::iter().collect()
  }

  pub fn to_str(&self) -> &'static str {
    match self {
      Self::FalQueue => "fal_queue",
      Self::Seedance2ProQueue => "seedance2pro_queue",
      Self::WorldlabsQueue => "worldlabs_queue",
      Self::VideoRender => "video_render",
      Self::LivePortrait => "live_portrait",
      Self::FaceFusion => "face_fusion",
      Self::F5TTS => "f5_tts",
      Self::GptSovits => "gpt_sovits",
      Self::ComfyUi => "comfy_ui",
      Self::StudioGen2 => "studio_gen2",
      Self::ImageGenApi => "image_gen_api",
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
      "fal_queue" => Ok(Self::FalQueue),
      "seedance2pro_queue" => Ok(Self::Seedance2ProQueue),
      "worldlabs_queue" => Ok(Self::WorldlabsQueue),
      "video_render" => Ok(Self::VideoRender),
      "live_portrait" => Ok(Self::LivePortrait),
      "face_fusion" => Ok(Self::FaceFusion),
      "f5_tts" => Ok(Self::F5TTS),
      "gpt_sovits" => Ok(Self::GptSovits),
      "comfy_ui" => Ok(Self::ComfyUi),
      "studio_gen2" => Ok(Self::StudioGen2),
      "image_gen_api" => Ok(Self::ImageGenApi),
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

}

#[cfg(test)]
mod tests {
  use super::InferenceJobType;
  use enums_shared::test_helpers::assert_serialization;

  mod explicit_checks {
    use super::*;

    #[test]
    fn default() {
      assert_eq!(InferenceJobType::default(), InferenceJobType::Unknown);
    }

    #[test]
    fn test_serialization() {
      assert_serialization(InferenceJobType::FalQueue, "fal_queue");
      assert_serialization(InferenceJobType::Seedance2ProQueue, "seedance2pro_queue");
      assert_serialization(InferenceJobType::WorldlabsQueue, "worldlabs_queue");
      assert_serialization(InferenceJobType::VideoRender, "video_render");
      assert_serialization(InferenceJobType::LivePortrait, "live_portrait");
      assert_serialization(InferenceJobType::FaceFusion, "face_fusion");
      assert_serialization(InferenceJobType::F5TTS, "f5_tts");
      assert_serialization(InferenceJobType::GptSovits, "gpt_sovits");
      assert_serialization(InferenceJobType::ComfyUi, "comfy_ui");
      assert_serialization(InferenceJobType::StudioGen2, "studio_gen2");
      assert_serialization(InferenceJobType::ImageGenApi, "image_gen_api");
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
      assert_eq!(InferenceJobType::FalQueue.to_str(), "fal_queue");
      assert_eq!(InferenceJobType::Seedance2ProQueue.to_str(), "seedance2pro_queue");
      assert_eq!(InferenceJobType::WorldlabsQueue.to_str(), "worldlabs_queue");
      assert_eq!(InferenceJobType::VideoRender.to_str(), "video_render");
      assert_eq!(InferenceJobType::LivePortrait.to_str(), "live_portrait");
      assert_eq!(InferenceJobType::FaceFusion.to_str(), "face_fusion");
      assert_eq!(InferenceJobType::F5TTS.to_str(), "f5_tts");
      assert_eq!(InferenceJobType::GptSovits.to_str(), "gpt_sovits");
      assert_eq!(InferenceJobType::ComfyUi.to_str(), "comfy_ui");
      assert_eq!(InferenceJobType::StudioGen2.to_str(), "studio_gen2");
      assert_eq!(InferenceJobType::ImageGenApi.to_str(), "image_gen_api");
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
      assert_eq!(InferenceJobType::from_str("fal_queue").unwrap(), InferenceJobType::FalQueue);
      assert_eq!(InferenceJobType::from_str("seedance2pro_queue").unwrap(), InferenceJobType::Seedance2ProQueue);
      assert_eq!(InferenceJobType::from_str("worldlabs_queue").unwrap(), InferenceJobType::WorldlabsQueue);
      assert_eq!(InferenceJobType::from_str("video_render").unwrap(), InferenceJobType::VideoRender);
      assert_eq!(InferenceJobType::from_str("live_portrait").unwrap(), InferenceJobType::LivePortrait);
      assert_eq!(InferenceJobType::from_str("face_fusion").unwrap(), InferenceJobType::FaceFusion);
      assert_eq!(InferenceJobType::from_str("f5_tts").unwrap(), InferenceJobType::F5TTS);
      assert_eq!(InferenceJobType::from_str("gpt_sovits").unwrap(), InferenceJobType::GptSovits);
      assert_eq!(InferenceJobType::from_str("comfy_ui").unwrap(), InferenceJobType::ComfyUi);
      assert_eq!(InferenceJobType::from_str("studio_gen2").unwrap(), InferenceJobType::StudioGen2);
      assert_eq!(InferenceJobType::from_str("image_gen_api").unwrap(), InferenceJobType::ImageGenApi);
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

  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip() {
      use strum::IntoEnumIterator;
      for variant in InferenceJobType::iter() {
        assert_eq!(variant, InferenceJobType::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, InferenceJobType::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, InferenceJobType::from_str(&format!("{:?}", variant)).unwrap());
      }
    }

    #[test]
    fn serialized_length_ok_for_database() {
      use strum::IntoEnumIterator;
      const MAX_LENGTH: usize = 32; // TODO(bt): Confirm database column width, then remove this comment.
      for variant in InferenceJobType::iter() {
        let serialized = variant.to_str();
        assert!(!serialized.is_empty(), "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long", variant);
      }
    }
  
    #[test]
    fn all_variants_returns_all() {
      let variants = InferenceJobType::all_variants();
      assert_eq!(variants.len(), 23);
    }

    #[test]
    fn all_variants_matches_iter_count() {
      use strum::IntoEnumIterator;
      assert_eq!(InferenceJobType::all_variants().len(), InferenceJobType::iter().count());
    }
  }
}
