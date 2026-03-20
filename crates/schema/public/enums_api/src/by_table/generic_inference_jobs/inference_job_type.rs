use strum::EnumIter;
use utoipa::ToSchema;

/// Report certain jobs publicly as different from what we actually run.
/// This is so we have an edge against the competition that might try to run
/// the same models or workflows.
///
/// Previously named `PublicInferenceJobType` in the `enums_public` crate.
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize, Default, ToSchema, Debug, EnumIter)]
#[serde(rename_all = "snake_case")]
pub enum InferenceJobType {
  // ======= Renamed enum variants  ======

  /// Instead of DB `InferenceJobType::LivePortrait` ("live_portrait")
  ActingFace,

  /// Instead of DB `InferenceJobType::FaceFusion` ("face_fusion")
  Lipsync,

  /// Storyteller Studio and Video Style Transfer Jobs.
  VideoRender,

  GptSovits,

  #[serde(rename = "f5_tts")]
  F5TTS,

  // ======= Everything else is the same =======

  #[serde(rename = "fal_queue")]
  FalQueue,

  #[deprecated(note = "Use VideoRender instead.")]
  ComfyUi,

  #[serde(rename = "studio_gen2")]
  StudioGen2,

  #[serde(rename = "convert_fbx_gltf")]
  ConvertFbxToGltf,

  MocapNet,

  #[serde(rename = "rvc_v2")]
  RvcV2,

  SadTalker,

  #[serde(rename = "seed_vc")]
  SeedVc,

  SoVitsSvc,

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

  #[serde(rename = "image_gen_api")]
  ImageGenApi,

  #[serde(rename = "seedance2pro_queue")]
  Seedance2ProQueue,

  #[serde(rename = "worldlabs_queue")]
  WorldlabsQueue,
}

#[cfg(test)]
mod tests {
  use super::InferenceJobType;
  use enums_shared::test_helpers::{assert_deserialization, assert_serialization};
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(InferenceJobType::ActingFace, "acting_face");
      assert_serialization(InferenceJobType::Lipsync, "lipsync");
      assert_serialization(InferenceJobType::VideoRender, "video_render");
      assert_serialization(InferenceJobType::GptSovits, "gpt_sovits");
      assert_serialization(InferenceJobType::F5TTS, "f5_tts");
      assert_serialization(InferenceJobType::FalQueue, "fal_queue");
      assert_serialization(InferenceJobType::ComfyUi, "comfy_ui");
      assert_serialization(InferenceJobType::StudioGen2, "studio_gen2");
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
      assert_serialization(InferenceJobType::ImageGenApi, "image_gen_api");
      assert_serialization(InferenceJobType::Seedance2ProQueue, "seedance2pro_queue");
      assert_serialization(InferenceJobType::WorldlabsQueue, "worldlabs_queue");
    }

    #[test]
    fn test_deserialization() {
      assert_deserialization("acting_face", InferenceJobType::ActingFace);
      assert_deserialization("lipsync", InferenceJobType::Lipsync);
      assert_deserialization("video_render", InferenceJobType::VideoRender);
      assert_deserialization("gpt_sovits", InferenceJobType::GptSovits);
      assert_deserialization("f5_tts", InferenceJobType::F5TTS);
      assert_deserialization("fal_queue", InferenceJobType::FalQueue);
      assert_deserialization("comfy_ui", InferenceJobType::ComfyUi);
      assert_deserialization("studio_gen2", InferenceJobType::StudioGen2);
      assert_deserialization("convert_fbx_gltf", InferenceJobType::ConvertFbxToGltf);
      assert_deserialization("mocap_net", InferenceJobType::MocapNet);
      assert_deserialization("rvc_v2", InferenceJobType::RvcV2);
      assert_deserialization("sad_talker", InferenceJobType::SadTalker);
      assert_deserialization("seed_vc", InferenceJobType::SeedVc);
      assert_deserialization("so_vits_svc", InferenceJobType::SoVitsSvc);
      assert_deserialization("stable_diffusion", InferenceJobType::StableDiffusion);
      assert_deserialization("styletts2", InferenceJobType::StyleTTS2);
      assert_deserialization("tacotron2", InferenceJobType::Tacotron2);
      assert_deserialization("unknown", InferenceJobType::Unknown);
      assert_deserialization("bevy_to_workflow", InferenceJobType::BevyToWorkflow);
      assert_deserialization("rerender_a_video", InferenceJobType::RerenderAVideo);
      assert_deserialization("image_gen_api", InferenceJobType::ImageGenApi);
      assert_deserialization("seedance2pro_queue", InferenceJobType::Seedance2ProQueue);
      assert_deserialization("worldlabs_queue", InferenceJobType::WorldlabsQueue);
    }

    #[test]
    fn variants_count_check() {
      assert_eq!(InferenceJobType::iter().count(), 23);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in InferenceJobType::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: InferenceJobType = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
