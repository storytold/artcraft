use strum::EnumCount;
use strum::EnumIter;

/// Used in the `generic_inference_jobs` table in `VARCHAR(32)` field `maybe_model_type`.
///
/// Our "generic inference" pipeline supports a wide variety of ML models and other media.
/// Each inference "model type" identified by the following enum variants, though some pipelines
/// may use multiple models or no model (and may report NULL).
///
/// These types are present in the HTTP API and database columns as serialized here.
///
/// YOU CAN ADD NEW VALUES, BUT DO NOT CHANGE EXISTING VALUES WITHOUT A MIGRATION STRATEGY.
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize, EnumIter, EnumCount)]
pub enum InferenceModelType {
  // TODO(bt,2024-07-15): This is too generic. We probably need "StorytellerStudio", "LivePortrait", etc.
  #[serde(rename = "comfy_ui")]
  ComfyUi,

  #[serde(rename = "rvc_v2")]
  RvcV2,
  // NB: sad_talker does use user-supplied models, so there is no "model token"
  #[serde(rename = "sad_talker")]
  SadTalker,
  #[serde(rename = "so_vits_svc")]
  SoVitsSvc,
  // TODO: Does this need to be "legacy_tacotron2" ?

  #[serde(rename = "seed_vc")]
  SeedVc,

  /// NB: This is for Sora GPT 4o image gen
  #[serde(rename = "image_gen_api")]
  ImageGenApi,

  #[serde(rename = "tacotron2")]
  Tacotron2,
  #[serde(rename = "vits")]
  Vits,
  #[serde(rename = "vall_e_x")]
  VallEX,
  #[serde(rename = "rerender_a_video")]
  RerenderAVideo,
  #[serde(rename = "stable_diffusion")]
  StableDiffusion,
  #[serde(rename = "mocap_net")]
  MocapNet,
  #[serde(rename = "styletts2")]
  StyleTTS2,
  /// A job that turns "FBX" game engine files into "GLTF" files (Bevy-compatible).
  #[serde(rename = "convert_fbx_gltf")]
  ConvertFbxToGltf,
  #[serde(rename = "bvh_to_workflow")]
  BvhToWorkflow
}

// TODO(bt, 2022-12-21): This desperately needs MySQL integration tests!
impl_enum_display_and_debug_using_to_str!(InferenceModelType);
impl_mysql_enum_coders!(InferenceModelType);
impl_mysql_from_row!(InferenceModelType);

/// NB: Legacy API for older code.
impl InferenceModelType {
  pub fn all_variants() -> std::collections::BTreeSet<Self> {
    use strum::IntoEnumIterator;
    Self::iter().collect()
  }

  pub fn to_str(&self) -> &'static str {
    match self {
      Self::RvcV2 => "rvc_v2",
      Self::SadTalker => "sad_talker",
      Self::SoVitsSvc => "so_vits_svc",
      Self::Tacotron2 => "tacotron2",
      Self::Vits => "vits",
      Self::VallEX => "vall_e_x",
      Self::RerenderAVideo => "rerender_a_video",
      Self::StableDiffusion => "stable_diffusion",
      Self::ImageGenApi => "image_gen_api",
      Self::SeedVc => "seed_vc",
      Self::MocapNet => "mocap_net",
      Self::StyleTTS2 => "styletts2",
      Self::ComfyUi => "comfy_ui",
      Self::ConvertFbxToGltf => "convert_fbx_gltf",
      Self::BvhToWorkflow => "bvh_to_workflow",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "rvc_v2" => Ok(Self::RvcV2),
      "sad_talker" => Ok(Self::SadTalker),
      "so_vits_svc" => Ok(Self::SoVitsSvc),
      "seed_vc" => Ok(Self::SeedVc),
      "tacotron2" => Ok(Self::Tacotron2),
      "vits" => Ok(Self::Vits),
      "vall_e_x" => Ok(Self::VallEX),
      "rerender_a_video" => Ok(Self::RerenderAVideo),
      "stable_diffusion" => Ok(Self::StableDiffusion),
      "image_gen_api" => Ok(Self::ImageGenApi),
      "mocap_net" => Ok(Self::MocapNet),
      "styletts2" => Ok(Self::StyleTTS2),
      "comfy_ui" => Ok(Self::ComfyUi),
      "convert_fbx_gltf" => Ok(Self::ConvertFbxToGltf),
      "bvh_to_workflow" => Ok(Self::BvhToWorkflow),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }

}

#[cfg(test)]
mod tests {
  use super::super::inference_model_type::InferenceModelType;
  use enums_shared::test_helpers::assert_serialization;

  mod explicit_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(InferenceModelType::RvcV2, "rvc_v2");
      assert_serialization(InferenceModelType::SadTalker, "sad_talker");
      assert_serialization(InferenceModelType::SeedVc, "seed_vc");
      assert_serialization(InferenceModelType::SoVitsSvc, "so_vits_svc");
      assert_serialization(InferenceModelType::Tacotron2, "tacotron2");
      assert_serialization(InferenceModelType::Vits, "vits");
      assert_serialization(InferenceModelType::VallEX, "vall_e_x");
      assert_serialization(InferenceModelType::RerenderAVideo, "rerender_a_video");
      assert_serialization(InferenceModelType::StableDiffusion, "stable_diffusion");
      assert_serialization(InferenceModelType::ImageGenApi, "image_gen_api");
      assert_serialization(InferenceModelType::MocapNet, "mocap_net");
      assert_serialization(InferenceModelType::ComfyUi, "comfy_ui");
      assert_serialization(InferenceModelType::StyleTTS2, "styletts2");
      assert_serialization(InferenceModelType::ConvertFbxToGltf, "convert_fbx_gltf");
      assert_serialization(InferenceModelType::BvhToWorkflow, "bvh_to_workflow");
    }

    #[test]
    fn to_str() {
      assert_eq!(InferenceModelType::ComfyUi.to_str(), "comfy_ui");
      assert_eq!(InferenceModelType::RvcV2.to_str(), "rvc_v2");
      assert_eq!(InferenceModelType::SadTalker.to_str(), "sad_talker");
      assert_eq!(InferenceModelType::SoVitsSvc.to_str(), "so_vits_svc");
      assert_eq!(InferenceModelType::SoVitsSvc.to_str(), "so_vits_svc");
      assert_eq!(InferenceModelType::Tacotron2.to_str(), "tacotron2");
      assert_eq!(InferenceModelType::Vits.to_str(), "vits");
      assert_eq!(InferenceModelType::VallEX.to_str(), "vall_e_x");
      assert_eq!(InferenceModelType::RerenderAVideo.to_str(), "rerender_a_video");
      assert_eq!(InferenceModelType::StableDiffusion.to_str(), "stable_diffusion");
      assert_eq!(InferenceModelType::ImageGenApi.to_str(), "image_gen_api");
      assert_eq!(InferenceModelType::MocapNet.to_str(), "mocap_net");
      assert_eq!(InferenceModelType::StyleTTS2.to_str(), "styletts2");
      assert_eq!(InferenceModelType::ConvertFbxToGltf.to_str(), "convert_fbx_gltf");
      assert_eq!(InferenceModelType::BvhToWorkflow.to_str(), "bvh_to_workflow");
    }

    #[test]
    fn from_str() {
      assert_eq!(InferenceModelType::from_str("rvc_v2").unwrap(), InferenceModelType::RvcV2);
      assert_eq!(InferenceModelType::from_str("sad_talker").unwrap(), InferenceModelType::SadTalker);
      assert_eq!(InferenceModelType::from_str("seed_vc").unwrap(), InferenceModelType::SeedVc);
      assert_eq!(InferenceModelType::from_str("so_vits_svc").unwrap(), InferenceModelType::SoVitsSvc);
      assert_eq!(InferenceModelType::from_str("tacotron2").unwrap(), InferenceModelType::Tacotron2);
      assert_eq!(InferenceModelType::from_str("vits").unwrap(), InferenceModelType::Vits);
      assert_eq!(InferenceModelType::from_str("vall_e_x").unwrap(), InferenceModelType::VallEX);
      assert_eq!(InferenceModelType::from_str("rerender_a_video").unwrap(), InferenceModelType::RerenderAVideo);
      assert_eq!(InferenceModelType::from_str("stable_diffusion").unwrap(), InferenceModelType::StableDiffusion);
      assert_eq!(InferenceModelType::from_str("image_gen_api").unwrap(), InferenceModelType::ImageGenApi);
      assert_eq!(InferenceModelType::from_str("mocap_net").unwrap(), InferenceModelType::MocapNet);
      assert_eq!(InferenceModelType::from_str("styletts2").unwrap(), InferenceModelType::StyleTTS2);
      assert_eq!(InferenceModelType::from_str("comfy_ui").unwrap(), InferenceModelType::ComfyUi);
      assert_eq!(InferenceModelType::from_str("convert_fbx_gltf").unwrap(), InferenceModelType::ConvertFbxToGltf);
      assert_eq!(InferenceModelType::from_str("bvh_to_workflow").unwrap(), InferenceModelType::BvhToWorkflow);
    }

  }
  
  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip() {
      use strum::IntoEnumIterator;
      for variant in InferenceModelType::iter() {
        assert_eq!(variant, InferenceModelType::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, InferenceModelType::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, InferenceModelType::from_str(&format!("{:?}", variant)).unwrap());
      }
    }

    #[test]
    fn serialized_length_ok_for_database() {
      use strum::IntoEnumIterator;
      const MAX_LENGTH : usize = 32;
      for variant in InferenceModelType::iter() {
        let serialized = variant.to_str();
        assert!(serialized.len() > 0, "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long", variant);
      }
    }
  
    #[test]
    fn all_variants_returns_all() {
      let variants = InferenceModelType::all_variants();
      assert_eq!(variants.len(), 15);
    }

    #[test]
    fn all_variants_matches_iter_count() {
      use strum::IntoEnumIterator;
      assert_eq!(InferenceModelType::all_variants().len(), InferenceModelType::iter().count());
    }
  }
}
