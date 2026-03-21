use std::collections::BTreeSet;

use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `generic_inference_jobs` table in `VARCHAR(32)` field `maybe_model_type`.
///
/// Our "generic inference" pipeline supports a wide variety of ML models and other media.
/// Each inference "model type" identified by the following enum variants, though some pipelines
/// may use multiple models or no model (and may report NULL).
///
/// These types are present in the HTTP API and database columns as serialized here.
///
/// YOU CAN ADD NEW VALUES, BUT DO NOT CHANGE EXISTING VALUES WITHOUT A MIGRATION STRATEGY.
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize, ToSchema, EnumIter, Debug)]
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

/// NB: Legacy API for older code.
impl InferenceModelType {
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

  pub fn all_variants() -> BTreeSet<Self> {
    // NB: BTreeSet is sorted
    // NB: BTreeSet::from() isn't const, but not worth using LazyStatic, etc.
    BTreeSet::from([
      Self::ComfyUi,
      Self::RvcV2,
      Self::SadTalker,
      Self::SoVitsSvc,
      Self::SeedVc,
      Self::Tacotron2,
      Self::Vits,
      Self::VallEX,
      Self::RerenderAVideo,
      Self::StableDiffusion,
      Self::ImageGenApi,
      Self::MocapNet,
      Self::StyleTTS2,
      Self::ConvertFbxToGltf,
      Self::BvhToWorkflow,
    ])
  }
}

#[cfg(test)]
mod tests {
  use super::InferenceModelType;
  use strum::IntoEnumIterator;

  #[test]
  fn round_trip_json() {
    for variant in InferenceModelType::iter() {
      let json = serde_json::to_string(&variant).unwrap();
      let back: InferenceModelType = serde_json::from_str(&json).unwrap();
      assert_eq!(variant, back);
    }
  }
}
