use std::collections::BTreeSet;

use serde::Deserialize;
use serde::Serialize;
#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `media_files` table in a `VARCHAR` field.
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum MediaFileOriginModelType {
  #[serde(rename = "face_fusion")]
  FaceFusion,

  #[serde(rename = "f5_tts")]
  F5TTS,

  #[serde(rename = "live_portrait")]
  LivePortrait,

  /// RVC (v2) voice conversion models
  #[serde(rename = "rvc_v2")]
  RvcV2,

  /// SadTalker -- v1, we may add another enum value for future versions
  #[serde(rename = "sad_talker")]
  SadTalker,

  /// so-vits-svc voice conversion models
  #[serde(rename = "so_vits_svc")]
  SoVitsSvc,

  #[serde(rename = "tacotron2")]
  Tacotron2,

  #[serde(rename = "mocap_net")]
  MocapNet,

  #[serde(rename = "styletts2")]
  StyleTTS2,

  #[serde(rename = "stable_diffusion_1_5")]
  StableDiffusion15,

  #[serde(rename = "gpt_sovits")]
  GptSovits,

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

// TODO(bt, 2022-12-21): This desperately needs MySQL integration tests!
impl_enum_display_and_debug_using_to_str!(MediaFileOriginModelType);
impl_mysql_enum_coders!(MediaFileOriginModelType);
impl_mysql_from_row!(MediaFileOriginModelType);

/// NB: Legacy API for older code.
impl MediaFileOriginModelType {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::FaceFusion => "face_fusion",
      Self::F5TTS => "f5_tts",
      Self::LivePortrait => "live_portrait",
      Self::RvcV2  => "rvc_v2",
      Self::SadTalker => "sad_talker",
      Self::SoVitsSvc => "so_vits_svc",
      Self::Tacotron2 => "tacotron2",
      Self::MocapNet => "mocap_net",
      Self::StyleTTS2 => "styletts2",
      Self::StableDiffusion15 => "stable_diffusion_1_5",
      Self::GptSovits => "gpt_sovits",
      Self::StorytellerStudio => "studio",
      Self::VideoStyleTransfer => "vst",
      Self::ComfyUi => "comfy_ui",
      Self::VallEX => "vall_e_x",
      Self::Rerender => "rerender",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "face_fusion" => Ok(Self::FaceFusion),
      "f5_tts" => Ok(Self::F5TTS),
      "live_portrait" => Ok(Self::LivePortrait),
      "rvc_v2" => Ok(Self::RvcV2),
      "sad_talker" => Ok(Self::SadTalker),
      "so_vits_svc" => Ok(Self::SoVitsSvc),
      "tacotron2" => Ok(Self::Tacotron2),
      "mocap_net" => Ok(Self::MocapNet),
      "styletts2" => Ok(Self::StyleTTS2),
      "stable_diffusion_1_5" => Ok(Self::StableDiffusion15),
      "gpt_sovits" => Ok(Self::GptSovits),
      "studio" => Ok(Self::StorytellerStudio),
      "vst" => Ok(Self::VideoStyleTransfer),
      "comfy_ui" => Ok(Self::ComfyUi),
      "vall_e_x" => Ok(Self::VallEX),
      "rerender" => Ok(Self::Rerender),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    // NB: BTreeSet is sorted
    // NB: BTreeSet::from() isn't const, but not worth using LazyStatic, etc.
    BTreeSet::from([
      Self::FaceFusion,
      Self::F5TTS,
      Self::LivePortrait,
      Self::RvcV2,
      Self::SadTalker,
      Self::SoVitsSvc,
      Self::Tacotron2,
      Self::MocapNet,
      Self::StyleTTS2,
      Self::StableDiffusion15,
      Self::GptSovits,
      Self::StorytellerStudio,
      Self::VideoStyleTransfer,
      Self::ComfyUi,
      Self::VallEX,
      Self::Rerender,
    ])
  }
}

#[cfg(test)]
mod tests {
  use crate::by_table::media_files::media_file_origin_model_type::MediaFileOriginModelType;
  use crate::test_helpers::assert_serialization;

  mod explicit_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(MediaFileOriginModelType::FaceFusion, "face_fusion");
      assert_serialization(MediaFileOriginModelType::SadTalker, "sad_talker");
    }

    #[test]
    fn test_to_str() {
      assert_eq!(MediaFileOriginModelType::FaceFusion.to_str(), "face_fusion");
      assert_eq!(MediaFileOriginModelType::F5TTS.to_str(), "f5_tts");
      assert_eq!(MediaFileOriginModelType::LivePortrait.to_str(), "live_portrait");
      assert_eq!(MediaFileOriginModelType::RvcV2.to_str(), "rvc_v2");
      assert_eq!(MediaFileOriginModelType::SadTalker.to_str(), "sad_talker");
      assert_eq!(MediaFileOriginModelType::SoVitsSvc.to_str(), "so_vits_svc");
      assert_eq!(MediaFileOriginModelType::Tacotron2.to_str(), "tacotron2");
      assert_eq!(MediaFileOriginModelType::MocapNet.to_str(), "mocap_net");
      assert_eq!(MediaFileOriginModelType::StyleTTS2.to_str(), "styletts2");
      assert_eq!(MediaFileOriginModelType::StableDiffusion15.to_str(), "stable_diffusion_1_5");
      assert_eq!(MediaFileOriginModelType::GptSovits.to_str(), "gpt_sovits");
      assert_eq!(MediaFileOriginModelType::StorytellerStudio.to_str(), "studio");
      assert_eq!(MediaFileOriginModelType::VideoStyleTransfer.to_str(), "vst");
      assert_eq!(MediaFileOriginModelType::ComfyUi.to_str(), "comfy_ui");
      assert_eq!(MediaFileOriginModelType::VallEX.to_str(), "vall_e_x");
      assert_eq!(MediaFileOriginModelType::Rerender.to_str(), "rerender");
    }

    #[test]
    fn test_from_str() {
      assert_eq!(MediaFileOriginModelType::from_str("face_fusion").unwrap(), MediaFileOriginModelType::FaceFusion);
      assert_eq!(MediaFileOriginModelType::from_str("f5_tts").unwrap(), MediaFileOriginModelType::F5TTS);
      assert_eq!(MediaFileOriginModelType::from_str("live_portrait").unwrap(), MediaFileOriginModelType::LivePortrait);
      assert_eq!(MediaFileOriginModelType::from_str("rvc_v2").unwrap(), MediaFileOriginModelType::RvcV2);
      assert_eq!(MediaFileOriginModelType::from_str("sad_talker").unwrap(), MediaFileOriginModelType::SadTalker);
      assert_eq!(MediaFileOriginModelType::from_str("so_vits_svc").unwrap(), MediaFileOriginModelType::SoVitsSvc);
      assert_eq!(MediaFileOriginModelType::from_str("tacotron2").unwrap(), MediaFileOriginModelType::Tacotron2);
      assert_eq!(MediaFileOriginModelType::from_str("mocap_net").unwrap(), MediaFileOriginModelType::MocapNet);
      assert_eq!(MediaFileOriginModelType::from_str("styletts2").unwrap(), MediaFileOriginModelType::StyleTTS2);
      assert_eq!(MediaFileOriginModelType::from_str("stable_diffusion_1_5").unwrap(), MediaFileOriginModelType::StableDiffusion15);
      assert_eq!(MediaFileOriginModelType::from_str("gpt_sovits").unwrap(), MediaFileOriginModelType::GptSovits);
      assert_eq!(MediaFileOriginModelType::from_str("studio").unwrap(), MediaFileOriginModelType::StorytellerStudio);
      assert_eq!(MediaFileOriginModelType::from_str("vst").unwrap(), MediaFileOriginModelType::VideoStyleTransfer);
      assert_eq!(MediaFileOriginModelType::from_str("comfy_ui").unwrap(), MediaFileOriginModelType::ComfyUi);
      assert_eq!(MediaFileOriginModelType::from_str("vall_e_x").unwrap(), MediaFileOriginModelType::VallEX);
      assert_eq!(MediaFileOriginModelType::from_str("rerender").unwrap(), MediaFileOriginModelType::Rerender);
      assert!(MediaFileOriginModelType::from_str("foo").is_err());
    }

    #[test]
    fn all_variants() {
      let mut variants = MediaFileOriginModelType::all_variants();
      assert_eq!(variants.len(), 15);
      assert_eq!(variants.pop_first(), Some(MediaFileOriginModelType::FaceFusion));
      assert_eq!(variants.pop_first(), Some(MediaFileOriginModelType::F5TTS));
      assert_eq!(variants.pop_first(), Some(MediaFileOriginModelType::LivePortrait));
      assert_eq!(variants.pop_first(), Some(MediaFileOriginModelType::RvcV2));
      assert_eq!(variants.pop_first(), Some(MediaFileOriginModelType::SadTalker));
      assert_eq!(variants.pop_first(), Some(MediaFileOriginModelType::SoVitsSvc));
      assert_eq!(variants.pop_first(), Some(MediaFileOriginModelType::Tacotron2));
      assert_eq!(variants.pop_first(), Some(MediaFileOriginModelType::MocapNet));
      assert_eq!(variants.pop_first(), Some(MediaFileOriginModelType::StyleTTS2));
      assert_eq!(variants.pop_first(), Some(MediaFileOriginModelType::StableDiffusion15));
      assert_eq!(variants.pop_first(), Some(MediaFileOriginModelType::GptSovits));
      assert_eq!(variants.pop_first(), Some(MediaFileOriginModelType::StorytellerStudio));
      assert_eq!(variants.pop_first(), Some(MediaFileOriginModelType::VideoStyleTransfer));
      assert_eq!(variants.pop_first(), Some(MediaFileOriginModelType::ComfyUi));
      assert_eq!(variants.pop_first(), Some(MediaFileOriginModelType::VallEX));
      assert_eq!(variants.pop_first(), Some(MediaFileOriginModelType::Rerender));
      assert_eq!(variants.pop_first(), None);
    }
  }


  mod mechanical_checks {
    use super::*;

    #[test]
    fn variant_length() {
      use strum::IntoEnumIterator;
      assert_eq!(MediaFileOriginModelType::all_variants().len(), MediaFileOriginModelType::iter().len());
    }

    #[test]
    fn round_trip() {
      for variant in MediaFileOriginModelType::all_variants() {
        assert_eq!(variant, MediaFileOriginModelType::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, MediaFileOriginModelType::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, MediaFileOriginModelType::from_str(&format!("{:?}", variant)).unwrap());
      }
    }

    #[test]
    fn serialized_length_ok_for_database() {
      const MAX_LENGTH : usize = 32;
      for variant in MediaFileOriginModelType::all_variants() {
        let serialized = variant.to_str();
        assert!(serialized.len() > 0, "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long", variant);
      }
    }
  }
}
