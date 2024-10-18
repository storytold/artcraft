use serde::Deserialize;
use serde::Serialize;
#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;
use utoipa::ToSchema;

use enums::by_table::media_files::media_file_origin_model_type::MediaFileOriginModelType;

/// Report certain models publicly as different from what we actually use.
/// This is so we have an edge against the competition that might try to run
/// the same models. This won't always make sense, but in some cases it will.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize, ToSchema, Debug)]
#[serde(rename_all = "snake_case")]
pub enum PublicMediaFileModelType {
  // Renamed enum variants

  /// Instead of `MediaFileOriginModelType::LivePortrait` ("live_portrait")
  #[serde(rename = "face_mirror")]
  FaceMirror,

  /// Instead of `MediaFileOriginModelType::SadTalker` ("sad_talker")
  #[serde(rename = "face_animator")]
  FaceAnimator,

  /// Instead of `MediaFileOriginModelType::FaceFusion` ("face_fusion")
  #[serde(rename = "lipsync")]
  Lipsync,

  /// Instead of `MediaFileOriginModelType::StyleTTS2` ("styletts2")
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

  #[serde(rename = "studio")]
  StorytellerStudio,

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

/// NB: Legacy API for older code.
impl PublicMediaFileModelType {
  pub fn from_enum(model_type: MediaFileOriginModelType) -> Self {
    match model_type {
      // Renamed variants
      MediaFileOriginModelType::FaceFusion => Self::Lipsync,
      MediaFileOriginModelType::LivePortrait => Self::FaceMirror,
      MediaFileOriginModelType::SadTalker => Self::FaceAnimator,
      MediaFileOriginModelType::StyleTTS2 => Self::VoiceDesigner,
      // Conserved variants
      MediaFileOriginModelType::RvcV2 => Self::RvcV2,
      MediaFileOriginModelType::SoVitsSvc => Self::SoVitsSvc,
      MediaFileOriginModelType::Tacotron2 => Self::Tacotron2,
      MediaFileOriginModelType::MocapNet => Self::MocapNet,
      MediaFileOriginModelType::StableDiffusion15 => Self::StableDiffusion15,
      MediaFileOriginModelType::GptSovits => Self::GptSovits,
      MediaFileOriginModelType::F5TTS => Self::F5TTS,
      MediaFileOriginModelType::StorytellerStudio => Self::StorytellerStudio,
      MediaFileOriginModelType::VideoStyleTransfer => Self::VideoStyleTransfer,
      MediaFileOriginModelType::ComfyUi => Self::ComfyUi,
      MediaFileOriginModelType::VallEX => Self::VallEX,
      MediaFileOriginModelType::Rerender => Self::Rerender,
    }
  }

  pub fn to_enum(&self) -> MediaFileOriginModelType {
    match self {
      // Renamed variants
      Self::FaceMirror => MediaFileOriginModelType::LivePortrait,
      Self::FaceAnimator => MediaFileOriginModelType::SadTalker,
      Self::Lipsync => MediaFileOriginModelType::FaceFusion,
      Self::VoiceDesigner => MediaFileOriginModelType::StyleTTS2,
      // Conserved variants
      Self::RvcV2 => MediaFileOriginModelType::RvcV2,
      Self::SoVitsSvc => MediaFileOriginModelType::SoVitsSvc,
      Self::Tacotron2 => MediaFileOriginModelType::Tacotron2,
      Self::MocapNet => MediaFileOriginModelType::MocapNet,
      Self::StableDiffusion15 => MediaFileOriginModelType::StableDiffusion15,
      Self::GptSovits => MediaFileOriginModelType::GptSovits,
      Self::F5TTS => MediaFileOriginModelType::F5TTS,
      Self::StorytellerStudio => MediaFileOriginModelType::StorytellerStudio,
      Self::VideoStyleTransfer => MediaFileOriginModelType::VideoStyleTransfer,
      Self::ComfyUi => MediaFileOriginModelType::ComfyUi,
      Self::VallEX => MediaFileOriginModelType::VallEX,
      Self::Rerender => MediaFileOriginModelType::Rerender,
    }
  }
}

#[cfg(test)]
mod tests {
  use strum::IntoEnumIterator;

  use crate::test_helpers::to_json;

  use super::*;

  fn override_enums() -> &'static [PublicMediaFileModelType; 4] {
    &[
      PublicMediaFileModelType::FaceMirror,
      PublicMediaFileModelType::FaceAnimator,
      PublicMediaFileModelType::Lipsync,
      PublicMediaFileModelType::VoiceDesigner,
    ]
  }

  mod override_values {
    use super::*;

    #[test]
    fn face_fusion() {
      // Public --> Internal
      assert_eq!(PublicMediaFileModelType::Lipsync.to_enum(), MediaFileOriginModelType::FaceFusion);
      assert_eq!(to_json(&PublicMediaFileModelType::Lipsync.to_enum()), "face_fusion");

      // Internal --> Public
      assert_eq!(PublicMediaFileModelType::from_enum(MediaFileOriginModelType::FaceFusion), PublicMediaFileModelType::Lipsync);
      assert_eq!(to_json(&PublicMediaFileModelType::from_enum(MediaFileOriginModelType::FaceFusion)), "lipsync");
    }

    #[test]
    fn live_portrait() {
      // Public --> Internal
      assert_eq!(PublicMediaFileModelType::FaceMirror.to_enum(), MediaFileOriginModelType::LivePortrait);
      assert_eq!(to_json(&PublicMediaFileModelType::FaceMirror.to_enum()), "live_portrait");

      // Internal --> Public
      assert_eq!(PublicMediaFileModelType::from_enum(MediaFileOriginModelType::LivePortrait), PublicMediaFileModelType::FaceMirror);
      assert_eq!(to_json(&PublicMediaFileModelType::from_enum(MediaFileOriginModelType::LivePortrait)), "face_mirror");
    }

    #[test]
    fn sad_talker() {
      // Public --> Internal
      assert_eq!(PublicMediaFileModelType::FaceAnimator.to_enum(), MediaFileOriginModelType::SadTalker);
      assert_eq!(to_json(&PublicMediaFileModelType::FaceAnimator.to_enum()), "sad_talker");

      // Internal --> Public
      assert_eq!(PublicMediaFileModelType::from_enum(MediaFileOriginModelType::SadTalker), PublicMediaFileModelType::FaceAnimator);
      assert_eq!(to_json(&PublicMediaFileModelType::from_enum(MediaFileOriginModelType::SadTalker)), "face_animator");
    }

    #[test]
    fn styletts2() {
      // Public --> Internal
      assert_eq!(PublicMediaFileModelType::VoiceDesigner.to_enum(), MediaFileOriginModelType::StyleTTS2);
      assert_eq!(to_json(&PublicMediaFileModelType::VoiceDesigner.to_enum()), "styletts2");

      // Internal --> Public
      assert_eq!(PublicMediaFileModelType::from_enum(MediaFileOriginModelType::StyleTTS2), PublicMediaFileModelType::VoiceDesigner);
      assert_eq!(to_json(&PublicMediaFileModelType::from_enum(MediaFileOriginModelType::StyleTTS2)), "voice_designer");
    }
  }

  mod mechanical_checks {
    use enums::by_table::media_files::media_file_origin_model_type::MediaFileOriginModelType;

    use super::*;

    #[test]
    fn public_to_internal() {
      let mut tested_count = 0;

      for public_variant in PublicMediaFileModelType::iter() {
        match public_variant {
          PublicMediaFileModelType::FaceMirror |
          PublicMediaFileModelType::FaceAnimator |
          PublicMediaFileModelType::Lipsync |
          PublicMediaFileModelType::VoiceDesigner => continue, // Can't compare.
          _ => {}
        }

        // Round trip
        assert_eq!(public_variant, PublicMediaFileModelType::from_enum(public_variant.to_enum()));

        let internal_enum_variant = public_variant.to_enum();
        let internal_enum_string = to_json(&internal_enum_variant);
        let public_enum_string = to_json(&public_variant);

        assert_eq!(internal_enum_string, public_enum_string);

        tested_count += 1;
      }

      assert!(tested_count > 1);
      assert_eq!(tested_count, PublicMediaFileModelType::iter().len() - override_enums().len());
    }

    #[test]
    fn internal_to_public() {
      let mut tested_count = 0;

      for internal_variant in MediaFileOriginModelType::all_variants() {
        match internal_variant {
          MediaFileOriginModelType::FaceFusion |
          MediaFileOriginModelType::LivePortrait |
          MediaFileOriginModelType::SadTalker |
          MediaFileOriginModelType::StyleTTS2 => continue, // Can't compare.
          _ => {}
        }

        // Round trip
        assert_eq!(internal_variant, PublicMediaFileModelType::from_enum(internal_variant).to_enum());

        let public_enum_variant = PublicMediaFileModelType::from_enum(internal_variant);
        let public_enum_string = to_json(&public_enum_variant);
        let internal_enum_string = to_json(&internal_variant);

        // Same serialization
        assert_eq!(internal_enum_string, public_enum_string);

        tested_count += 1;
      }

      assert!(tested_count > 1);
      assert_eq!(tested_count, MediaFileOriginModelType::all_variants().len() - override_enums().len());
    }
  }
}
