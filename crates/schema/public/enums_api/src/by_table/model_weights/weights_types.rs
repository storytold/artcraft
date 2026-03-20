use strum::EnumIter;
use utoipa::ToSchema;

/// Report certain models publicly as different from what we actually use.
///
/// Previously named `PublicWeightsType` in the `enums_public` crate.
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize, ToSchema, Debug, EnumIter)]

pub enum WeightsType {
  // Renamed enum variants

  /// Instead of DB `WeightsType::GptSoVits` ("gpt_so_vits")
  #[serde(rename = "tacotron2.5")]
  Tacotron2_5,

  // Everything else is the same

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
}

#[cfg(test)]
mod tests {
  use super::WeightsType;
  use enums_shared::test_helpers::{assert_deserialization, assert_serialization};
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(WeightsType::Tacotron2_5, "tacotron2.5");
      assert_serialization(WeightsType::HifiganTacotron2, "hifigan_tt2");
      assert_serialization(WeightsType::RvcV2, "rvc_v2");
      assert_serialization(WeightsType::StableDiffusion15, "sd_1.5");
      assert_serialization(WeightsType::StableDiffusionXL, "sdxl");
      assert_serialization(WeightsType::SoVitsSvc, "so_vits_svc");
      assert_serialization(WeightsType::Tacotron2, "tt2");
      assert_serialization(WeightsType::LoRA, "loRA");
      assert_serialization(WeightsType::VallE, "vall_e");
      assert_serialization(WeightsType::ComfyUi, "comfy_ui");
    }

    #[test]
    fn test_deserialization() {
      assert_deserialization("tacotron2.5", WeightsType::Tacotron2_5);
      assert_deserialization("hifigan_tt2", WeightsType::HifiganTacotron2);
      assert_deserialization("rvc_v2", WeightsType::RvcV2);
      assert_deserialization("sd_1.5", WeightsType::StableDiffusion15);
      assert_deserialization("sdxl", WeightsType::StableDiffusionXL);
      assert_deserialization("so_vits_svc", WeightsType::SoVitsSvc);
      assert_deserialization("tt2", WeightsType::Tacotron2);
      assert_deserialization("loRA", WeightsType::LoRA);
      assert_deserialization("vall_e", WeightsType::VallE);
      assert_deserialization("comfy_ui", WeightsType::ComfyUi);
    }

    #[test]
    fn variants_count_check() {
      assert_eq!(WeightsType::iter().count(), 10);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in WeightsType::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: WeightsType = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
