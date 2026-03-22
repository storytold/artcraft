use std::collections::BTreeSet;

#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;
use utoipa::ToSchema;

#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize, ToSchema)]
pub enum WeightsType {
  #[serde(rename = "hifigan_tt2")]
  HifiganTacotron2,
  #[serde(rename = "rvc_v2")]
  RvcV2,
  #[serde(rename = "sd_1.5")]
  StableDiffusion15,
  #[serde(rename = "sdxl")]
  StableDiffusionXL,
  #[serde(rename = "so_vits_svc")]
  SoVitsSvc,
  #[serde(rename = "tt2")]
  Tacotron2,
  #[serde(rename = "loRA")]
  LoRA,
  #[serde(rename = "vall_e")]
  VallE,
  #[serde(rename = "comfy_ui")]
  ComfyUi,

  /// NB: IN production these are filtered to `PublicWeightsType::Tacotron25`.
  #[serde(rename = "gpt_so_vits")]
  GptSoVits,
}


impl WeightsType {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::HifiganTacotron2 => "hifigan_tt2",
      Self::RvcV2 => "rvc_v2",
      Self::StableDiffusion15 => "sd_1.5",
      Self::StableDiffusionXL => "sdxl",
      Self::SoVitsSvc => "so_vits_svc",
      Self::Tacotron2 => "tt2",
      Self::LoRA => "loRA",
      Self::VallE => "vall_e",
      Self::ComfyUi => "comfy_ui",
      Self::GptSoVits => "gpt_so_vits",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "hifigan_tt2" => Ok(Self::HifiganTacotron2),
      "rvc_v2" => Ok(Self::RvcV2),
      "sd_1.5" => Ok(Self::StableDiffusion15),
      "sdxl" => Ok(Self::StableDiffusionXL),
      "so_vits_svc" => Ok(Self::SoVitsSvc),
      "tt2" => Ok(Self::Tacotron2),
      "loRA" => Ok(Self::LoRA),
      "vall_e" => Ok(Self::VallE),
      "comfy_ui" => Ok(Self::ComfyUi),
      "gpt_so_vits" => Ok(Self::GptSoVits),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    BTreeSet::from([
      Self::HifiganTacotron2,
      Self::RvcV2,
      Self::StableDiffusion15,
      Self::StableDiffusionXL,
      Self::SoVitsSvc,
      Self::Tacotron2,
      Self::LoRA,
      Self::VallE,
      Self::ComfyUi,
      Self::GptSoVits,
    ])
  }
}

impl_enum_display_and_debug_using_to_str!(WeightsType);
impl_mysql_enum_coders!(WeightsType);
impl_mysql_from_row!(WeightsType);

#[cfg(test)]
mod tests {
  use super::*;
  use crate::test_helpers::{assert_deserialization, assert_serialization};
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(WeightsType::HifiganTacotron2, "hifigan_tt2");
      assert_serialization(WeightsType::RvcV2, "rvc_v2");
      assert_serialization(WeightsType::StableDiffusion15, "sd_1.5");
      assert_serialization(WeightsType::StableDiffusionXL, "sdxl");
      assert_serialization(WeightsType::SoVitsSvc, "so_vits_svc");
      assert_serialization(WeightsType::Tacotron2, "tt2");
      assert_serialization(WeightsType::LoRA, "loRA");
      assert_serialization(WeightsType::VallE, "vall_e");
      assert_serialization(WeightsType::ComfyUi, "comfy_ui");
      assert_serialization(WeightsType::GptSoVits, "gpt_so_vits");
    }

    #[test]
    fn test_deserialization() {
      assert_deserialization("hifigan_tt2", WeightsType::HifiganTacotron2);
      assert_deserialization("rvc_v2", WeightsType::RvcV2);
      assert_deserialization("sd_1.5", WeightsType::StableDiffusion15);
      assert_deserialization("sdxl", WeightsType::StableDiffusionXL);
      assert_deserialization("so_vits_svc", WeightsType::SoVitsSvc);
      assert_deserialization("tt2", WeightsType::Tacotron2);
      assert_deserialization("loRA", WeightsType::LoRA);
      assert_deserialization("vall_e", WeightsType::VallE);
      assert_deserialization("comfy_ui", WeightsType::ComfyUi);
      assert_deserialization("gpt_so_vits", WeightsType::GptSoVits);
    }

    #[test]
    fn variants_count_check() {
      assert_eq!(WeightsType::iter().count(), 10);
    }

    #[test]
    fn to_str() {
      assert_eq!(WeightsType::HifiganTacotron2.to_str(), "hifigan_tt2");
      assert_eq!(WeightsType::RvcV2.to_str(), "rvc_v2");
      assert_eq!(WeightsType::StableDiffusion15.to_str(), "sd_1.5");
      assert_eq!(WeightsType::StableDiffusionXL.to_str(), "sdxl");
      assert_eq!(WeightsType::SoVitsSvc.to_str(), "so_vits_svc");
      assert_eq!(WeightsType::Tacotron2.to_str(), "tt2");
      assert_eq!(WeightsType::LoRA.to_str(), "loRA");
      assert_eq!(WeightsType::VallE.to_str(), "vall_e");
      assert_eq!(WeightsType::ComfyUi.to_str(), "comfy_ui");
      assert_eq!(WeightsType::GptSoVits.to_str(), "gpt_so_vits");
    }

    #[test]
    fn from_str() {
      assert_eq!(WeightsType::from_str("hifigan_tt2").unwrap(), WeightsType::HifiganTacotron2);
      assert_eq!(WeightsType::from_str("rvc_v2").unwrap(), WeightsType::RvcV2);
      assert_eq!(WeightsType::from_str("sd_1.5").unwrap(), WeightsType::StableDiffusion15);
      assert_eq!(WeightsType::from_str("sdxl").unwrap(), WeightsType::StableDiffusionXL);
      assert_eq!(WeightsType::from_str("so_vits_svc").unwrap(), WeightsType::SoVitsSvc);
      assert_eq!(WeightsType::from_str("tt2").unwrap(), WeightsType::Tacotron2);
      assert_eq!(WeightsType::from_str("loRA").unwrap(), WeightsType::LoRA);
      assert_eq!(WeightsType::from_str("vall_e").unwrap(), WeightsType::VallE);
      assert_eq!(WeightsType::from_str("comfy_ui").unwrap(), WeightsType::ComfyUi);
      assert_eq!(WeightsType::from_str("gpt_so_vits").unwrap(), WeightsType::GptSoVits);
      assert!(WeightsType::from_str("invalid").is_err());
    }

    #[test]
    fn all_variants() {
      let variants = WeightsType::all_variants();
      assert_eq!(variants.len(), 10);
      assert!(variants.contains(&WeightsType::HifiganTacotron2));
      assert!(variants.contains(&WeightsType::RvcV2));
      assert!(variants.contains(&WeightsType::StableDiffusion15));
      assert!(variants.contains(&WeightsType::StableDiffusionXL));
      assert!(variants.contains(&WeightsType::SoVitsSvc));
      assert!(variants.contains(&WeightsType::Tacotron2));
      assert!(variants.contains(&WeightsType::LoRA));
      assert!(variants.contains(&WeightsType::VallE));
      assert!(variants.contains(&WeightsType::ComfyUi));
      assert!(variants.contains(&WeightsType::GptSoVits));
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn variant_length() {
      assert_eq!(WeightsType::all_variants().len(), WeightsType::iter().len());
    }

    #[test]
    fn round_trip() {
      for variant in WeightsType::all_variants() {
        assert_eq!(variant, WeightsType::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, WeightsType::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, WeightsType::from_str(&format!("{:?}", variant)).unwrap());
      }
    }

    #[test]
    fn round_trip_json() {
      for variant in WeightsType::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: WeightsType = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }

    #[test]
    fn serialized_length_ok_for_database() {
      const MAX_LENGTH : usize = 16;
      for variant in WeightsType::all_variants() {
        let serialized = variant.to_str();
        assert!(serialized.len() > 0, "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long", variant);
      }
    }
  }
}
