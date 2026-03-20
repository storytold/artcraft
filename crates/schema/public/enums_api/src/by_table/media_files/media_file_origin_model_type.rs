use serde::Deserialize;
use serde::Serialize;
#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;
use utoipa::ToSchema;

/// Report certain models publicly as different from what we actually use.
/// This is so we have an edge against the competition that might try to run
/// the same models. This won't always make sense, but in some cases it will.
///
/// This was previously named `PublicMediaFileModelType` in the `enums_public` crate.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize, ToSchema, Debug)]
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

/// Convert between the API (public-facing) type and the DB (internal) type.
impl MediaFileOriginModelType {
  pub fn from_db(db_value: enums_db::by_table::media_files::media_file_origin_model_type::MediaFileOriginModelType) -> Self {
    use enums_db::by_table::media_files::media_file_origin_model_type::MediaFileOriginModelType as Db;
    match db_value {
      // Renamed variants
      Db::FaceFusion => Self::Lipsync,
      Db::LivePortrait => Self::FaceMirror,
      Db::SadTalker => Self::FaceAnimator,
      Db::StyleTTS2 => Self::VoiceDesigner,
      Db::StorytellerStudioImageGen => Self::StorytellerStudioImageGen,
      // Conserved variants
      Db::RvcV2 => Self::RvcV2,
      Db::SoVitsSvc => Self::SoVitsSvc,
      Db::SeedVc => Self::SeedVc,
      Db::Tacotron2 => Self::Tacotron2,
      Db::MocapNet => Self::MocapNet,
      Db::StableDiffusion15 => Self::StableDiffusion15,
      Db::GptSovits => Self::GptSovits,
      Db::F5TTS => Self::F5TTS,
      Db::StorytellerStudio => Self::StorytellerStudio,
      Db::VideoStyleTransfer => Self::VideoStyleTransfer,
      Db::ComfyUi => Self::ComfyUi,
      Db::VallEX => Self::VallEX,
      Db::Rerender => Self::Rerender,
    }
  }

  pub fn to_db(&self) -> enums_db::by_table::media_files::media_file_origin_model_type::MediaFileOriginModelType {
    use enums_db::by_table::media_files::media_file_origin_model_type::MediaFileOriginModelType as Db;
    match self {
      // Renamed variants
      Self::FaceMirror => Db::LivePortrait,
      Self::FaceAnimator => Db::SadTalker,
      Self::Lipsync => Db::FaceFusion,
      Self::VoiceDesigner => Db::StyleTTS2,
      Self::StorytellerStudioImageGen => Db::StorytellerStudioImageGen,
      // Conserved variants
      Self::RvcV2 => Db::RvcV2,
      Self::SoVitsSvc => Db::SoVitsSvc,
      Self::SeedVc => Db::SeedVc,
      Self::Tacotron2 => Db::Tacotron2,
      Self::MocapNet => Db::MocapNet,
      Self::StableDiffusion15 => Db::StableDiffusion15,
      Self::GptSovits => Db::GptSovits,
      Self::F5TTS => Db::F5TTS,
      Self::StorytellerStudio => Db::StorytellerStudio,
      Self::VideoStyleTransfer => Db::VideoStyleTransfer,
      Self::ComfyUi => Db::ComfyUi,
      Self::VallEX => Db::VallEX,
      Self::Rerender => Db::Rerender,
    }
  }
}

#[cfg(test)]
mod tests {
  use strum::IntoEnumIterator;
  use enums_shared::test_helpers::to_json;
  use super::*;

  fn override_enums() -> &'static [MediaFileOriginModelType; 4] {
    &[
      MediaFileOriginModelType::FaceMirror,
      MediaFileOriginModelType::FaceAnimator,
      MediaFileOriginModelType::Lipsync,
      MediaFileOriginModelType::VoiceDesigner,
    ]
  }

  mod override_values {
    use super::*;

    #[test]
    fn face_fusion() {
      use enums_db::by_table::media_files::media_file_origin_model_type::MediaFileOriginModelType as Db;
      assert_eq!(MediaFileOriginModelType::Lipsync.to_db(), Db::FaceFusion);
      assert_eq!(to_json(&MediaFileOriginModelType::Lipsync.to_db()), "face_fusion");
      assert_eq!(MediaFileOriginModelType::from_db(Db::FaceFusion), MediaFileOriginModelType::Lipsync);
      assert_eq!(to_json(&MediaFileOriginModelType::from_db(Db::FaceFusion)), "lipsync");
    }

    #[test]
    fn live_portrait() {
      use enums_db::by_table::media_files::media_file_origin_model_type::MediaFileOriginModelType as Db;
      assert_eq!(MediaFileOriginModelType::FaceMirror.to_db(), Db::LivePortrait);
      assert_eq!(to_json(&MediaFileOriginModelType::FaceMirror.to_db()), "live_portrait");
      assert_eq!(MediaFileOriginModelType::from_db(Db::LivePortrait), MediaFileOriginModelType::FaceMirror);
      assert_eq!(to_json(&MediaFileOriginModelType::from_db(Db::LivePortrait)), "face_mirror");
    }

    #[test]
    fn sad_talker() {
      use enums_db::by_table::media_files::media_file_origin_model_type::MediaFileOriginModelType as Db;
      assert_eq!(MediaFileOriginModelType::FaceAnimator.to_db(), Db::SadTalker);
      assert_eq!(to_json(&MediaFileOriginModelType::FaceAnimator.to_db()), "sad_talker");
      assert_eq!(MediaFileOriginModelType::from_db(Db::SadTalker), MediaFileOriginModelType::FaceAnimator);
      assert_eq!(to_json(&MediaFileOriginModelType::from_db(Db::SadTalker)), "face_animator");
    }

    #[test]
    fn styletts2() {
      use enums_db::by_table::media_files::media_file_origin_model_type::MediaFileOriginModelType as Db;
      assert_eq!(MediaFileOriginModelType::VoiceDesigner.to_db(), Db::StyleTTS2);
      assert_eq!(to_json(&MediaFileOriginModelType::VoiceDesigner.to_db()), "styletts2");
      assert_eq!(MediaFileOriginModelType::from_db(Db::StyleTTS2), MediaFileOriginModelType::VoiceDesigner);
      assert_eq!(to_json(&MediaFileOriginModelType::from_db(Db::StyleTTS2)), "voice_designer");
    }
  }

  mod mechanical_checks {
    use enums_db::by_table::media_files::media_file_origin_model_type::MediaFileOriginModelType as Db;
    use super::*;

    #[test]
    fn public_to_internal() {
      let mut tested_count = 0;
      for public_variant in MediaFileOriginModelType::iter() {
        match public_variant {
          MediaFileOriginModelType::FaceMirror |
          MediaFileOriginModelType::FaceAnimator |
          MediaFileOriginModelType::Lipsync |
          MediaFileOriginModelType::VoiceDesigner => continue,
          _ => {}
        }
        assert_eq!(public_variant, MediaFileOriginModelType::from_db(public_variant.to_db()));
        let internal_enum_string = to_json(&public_variant.to_db());
        let public_enum_string = to_json(&public_variant);
        assert_eq!(internal_enum_string, public_enum_string);
        tested_count += 1;
      }
      assert!(tested_count > 1);
      assert_eq!(tested_count, MediaFileOriginModelType::iter().len() - override_enums().len());
    }

    #[test]
    fn internal_to_public() {
      let mut tested_count = 0;
      for internal_variant in Db::all_variants() {
        match internal_variant {
          Db::FaceFusion | Db::LivePortrait | Db::SadTalker | Db::StyleTTS2 => continue,
          _ => {}
        }
        assert_eq!(internal_variant, MediaFileOriginModelType::from_db(internal_variant).to_db());
        let public_enum_string = to_json(&MediaFileOriginModelType::from_db(internal_variant));
        let internal_enum_string = to_json(&internal_variant);
        assert_eq!(internal_enum_string, public_enum_string);
        tested_count += 1;
      }
      assert!(tested_count > 1);
      assert_eq!(tested_count, Db::all_variants().len() - override_enums().len());
    }
  }
}
