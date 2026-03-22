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

#[cfg(test)]
mod tests {
  use super::InferenceModelType;
  use enums_shared::test_helpers::{assert_deserialization, assert_serialization};
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(InferenceModelType::ComfyUi, "comfy_ui");
      assert_serialization(InferenceModelType::RvcV2, "rvc_v2");
      assert_serialization(InferenceModelType::SadTalker, "sad_talker");
      assert_serialization(InferenceModelType::SoVitsSvc, "so_vits_svc");
      assert_serialization(InferenceModelType::SeedVc, "seed_vc");
      assert_serialization(InferenceModelType::ImageGenApi, "image_gen_api");
      assert_serialization(InferenceModelType::Tacotron2, "tacotron2");
      assert_serialization(InferenceModelType::Vits, "vits");
      assert_serialization(InferenceModelType::VallEX, "vall_e_x");
      assert_serialization(InferenceModelType::RerenderAVideo, "rerender_a_video");
      assert_serialization(InferenceModelType::StableDiffusion, "stable_diffusion");
      assert_serialization(InferenceModelType::MocapNet, "mocap_net");
      assert_serialization(InferenceModelType::StyleTTS2, "styletts2");
      assert_serialization(InferenceModelType::ConvertFbxToGltf, "convert_fbx_gltf");
      assert_serialization(InferenceModelType::BvhToWorkflow, "bvh_to_workflow");
    }

    #[test]
    fn test_deserialization() {
      assert_deserialization("comfy_ui", InferenceModelType::ComfyUi);
      assert_deserialization("rvc_v2", InferenceModelType::RvcV2);
      assert_deserialization("sad_talker", InferenceModelType::SadTalker);
      assert_deserialization("so_vits_svc", InferenceModelType::SoVitsSvc);
      assert_deserialization("seed_vc", InferenceModelType::SeedVc);
      assert_deserialization("image_gen_api", InferenceModelType::ImageGenApi);
      assert_deserialization("tacotron2", InferenceModelType::Tacotron2);
      assert_deserialization("vits", InferenceModelType::Vits);
      assert_deserialization("vall_e_x", InferenceModelType::VallEX);
      assert_deserialization("rerender_a_video", InferenceModelType::RerenderAVideo);
      assert_deserialization("stable_diffusion", InferenceModelType::StableDiffusion);
      assert_deserialization("mocap_net", InferenceModelType::MocapNet);
      assert_deserialization("styletts2", InferenceModelType::StyleTTS2);
      assert_deserialization("convert_fbx_gltf", InferenceModelType::ConvertFbxToGltf);
      assert_deserialization("bvh_to_workflow", InferenceModelType::BvhToWorkflow);
    }

    #[test]
    fn variants_count_check() {
      assert_eq!(InferenceModelType::iter().count(), 15);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in InferenceModelType::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: InferenceModelType = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
