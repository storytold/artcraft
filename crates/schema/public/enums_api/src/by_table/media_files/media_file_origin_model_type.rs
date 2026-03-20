use serde::Deserialize;
use serde::Serialize;
use strum::EnumIter;
use utoipa::ToSchema;

/// Report certain models publicly as different from what we actually use.
/// This is so we have an edge against the competition that might try to run
/// the same models. This won't always make sense, but in some cases it will.
///
/// This was previously named `PublicMediaFileModelType` in the `enums_public` crate.
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize, ToSchema, Debug, EnumIter)]
#[serde(rename_all = "snake_case")]
pub enum MediaFileOriginModelType {
  // Renamed enum variants

  /// Instead of DB `MediaFileOriginModelType::LivePortrait` ("live_portrait")
  #[serde(rename = "face_mirror")]
  FaceMirror,

  /// Instead of DB `MediaFileOriginModelType::SadTalker` ("sad_talker")
  #[serde(rename = "face_animator")]
  FaceAnimator,

  /// Instead of DB `MediaFileOriginModelType::FaceFusion` ("face_fusion")
  #[serde(rename = "lipsync")]
  Lipsync,

  /// Instead of DB `MediaFileOriginModelType::StyleTTS2` ("styletts2")
  #[serde(rename = "voice_designer")]
  VoiceDesigner,

  // Everything else is the same

  /// RVC (v2) voice conversion models
  #[serde(rename = "rvc_v2")]
  RvcV2,

  /// so-vits-svc voice conversion models
  #[serde(rename = "so_vits_svc")]
  SoVitsSvc,

  #[serde(rename = "tacotron2")]
  Tacotron2,

  #[serde(rename = "mocap_net")]
  MocapNet,

  #[serde(rename = "stable_diffusion_1_5")]
  StableDiffusion15,

  #[serde(rename = "gpt_sovits")]
  GptSovits,

  #[serde(rename = "f5_tts")]
  F5TTS,

  #[serde(rename = "seed_vc")]
  SeedVc,

  #[serde(rename = "studio")]
  StorytellerStudio,

  /// NB: This is GPT4o image generation
  #[serde(rename = "studio_ig")]
  StorytellerStudioImageGen,

  #[serde(rename = "vst")]
  VideoStyleTransfer,

  #[deprecated(note = "This is not a model type!")]
  #[serde(rename = "comfy_ui")]
  ComfyUi,

  #[deprecated(note = "We don't use this anymore")]
  #[serde(rename = "vall_e_x")]
  VallEX,

  #[deprecated(note = "We don't use this anymore")]
  #[serde(rename = "rerender")]
  Rerender,
}

#[cfg(test)]
mod tests {
  use super::MediaFileOriginModelType;
  use enums_shared::test_helpers::{assert_deserialization, assert_serialization};
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(MediaFileOriginModelType::FaceMirror, "face_mirror");
      assert_serialization(MediaFileOriginModelType::FaceAnimator, "face_animator");
      assert_serialization(MediaFileOriginModelType::Lipsync, "lipsync");
      assert_serialization(MediaFileOriginModelType::VoiceDesigner, "voice_designer");
      assert_serialization(MediaFileOriginModelType::RvcV2, "rvc_v2");
      assert_serialization(MediaFileOriginModelType::SoVitsSvc, "so_vits_svc");
      assert_serialization(MediaFileOriginModelType::Tacotron2, "tacotron2");
      assert_serialization(MediaFileOriginModelType::MocapNet, "mocap_net");
      assert_serialization(MediaFileOriginModelType::StableDiffusion15, "stable_diffusion_1_5");
      assert_serialization(MediaFileOriginModelType::GptSovits, "gpt_sovits");
      assert_serialization(MediaFileOriginModelType::F5TTS, "f5_tts");
      assert_serialization(MediaFileOriginModelType::SeedVc, "seed_vc");
      assert_serialization(MediaFileOriginModelType::StorytellerStudio, "studio");
      assert_serialization(MediaFileOriginModelType::StorytellerStudioImageGen, "studio_ig");
      assert_serialization(MediaFileOriginModelType::VideoStyleTransfer, "vst");
      assert_serialization(MediaFileOriginModelType::ComfyUi, "comfy_ui");
      assert_serialization(MediaFileOriginModelType::VallEX, "vall_e_x");
      assert_serialization(MediaFileOriginModelType::Rerender, "rerender");
    }

    #[test]
    fn test_deserialization() {
      assert_deserialization("face_mirror", MediaFileOriginModelType::FaceMirror);
      assert_deserialization("face_animator", MediaFileOriginModelType::FaceAnimator);
      assert_deserialization("lipsync", MediaFileOriginModelType::Lipsync);
      assert_deserialization("voice_designer", MediaFileOriginModelType::VoiceDesigner);
      assert_deserialization("rvc_v2", MediaFileOriginModelType::RvcV2);
      assert_deserialization("so_vits_svc", MediaFileOriginModelType::SoVitsSvc);
      assert_deserialization("tacotron2", MediaFileOriginModelType::Tacotron2);
      assert_deserialization("mocap_net", MediaFileOriginModelType::MocapNet);
      assert_deserialization("stable_diffusion_1_5", MediaFileOriginModelType::StableDiffusion15);
      assert_deserialization("gpt_sovits", MediaFileOriginModelType::GptSovits);
      assert_deserialization("f5_tts", MediaFileOriginModelType::F5TTS);
      assert_deserialization("seed_vc", MediaFileOriginModelType::SeedVc);
      assert_deserialization("studio", MediaFileOriginModelType::StorytellerStudio);
      assert_deserialization("studio_ig", MediaFileOriginModelType::StorytellerStudioImageGen);
      assert_deserialization("vst", MediaFileOriginModelType::VideoStyleTransfer);
      assert_deserialization("comfy_ui", MediaFileOriginModelType::ComfyUi);
      assert_deserialization("vall_e_x", MediaFileOriginModelType::VallEX);
      assert_deserialization("rerender", MediaFileOriginModelType::Rerender);
    }

    #[test]
    fn variants_count_check() {
      assert_eq!(MediaFileOriginModelType::iter().count(), 18);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in MediaFileOriginModelType::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: MediaFileOriginModelType = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
