#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;
use utoipa::ToSchema;

/// Report certain models publicly as different from what we actually use.
///
/// Previously named `PublicWeightsType` in the `enums_public` crate.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize, ToSchema, Debug)]
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

impl WeightsType {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::Tacotron2_5 => "tacotron2.5",
      Self::HifiganTacotron2 => "hifigan_tt2",
      Self::RvcV2 => "rvc_v2",
      Self::StableDiffusion15 => "sd_1.5",
      Self::StableDiffusionXL => "sdxl",
      Self::SoVitsSvc => "so_vits_svc",
      Self::Tacotron2 => "tt2",
      Self::LoRA => "loRA",
      Self::VallE => "vall_e",
      Self::ComfyUi => "comfy_ui",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "tacotron2.5" => Ok(Self::Tacotron2_5),
      "hifigan_tt2" => Ok(Self::HifiganTacotron2),
      "rvc_v2" => Ok(Self::RvcV2),
      "sd_1.5" => Ok(Self::StableDiffusion15),
      "sdxl" => Ok(Self::StableDiffusionXL),
      "so_vits_svc" => Ok(Self::SoVitsSvc),
      "tt2" => Ok(Self::Tacotron2),
      "loRA" => Ok(Self::LoRA),
      "vall_e" => Ok(Self::VallE),
      "comfy_ui" => Ok(Self::ComfyUi),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }

  pub fn from_db(db_value: enums_db::by_table::model_weights::weights_types::WeightsType) -> Self {
    use enums_db::by_table::model_weights::weights_types::WeightsType as Db;
    match db_value {
      Db::GptSoVits => Self::Tacotron2_5,
      Db::HifiganTacotron2 => Self::HifiganTacotron2,
      Db::RvcV2 => Self::RvcV2,
      Db::StableDiffusion15 => Self::StableDiffusion15,
      Db::StableDiffusionXL => Self::StableDiffusionXL,
      Db::SoVitsSvc => Self::SoVitsSvc,
      Db::Tacotron2 => Self::Tacotron2,
      Db::LoRA => Self::LoRA,
      Db::VallE => Self::VallE,
      Db::ComfyUi => Self::ComfyUi,
    }
  }

  pub fn to_db(&self) -> enums_db::by_table::model_weights::weights_types::WeightsType {
    use enums_db::by_table::model_weights::weights_types::WeightsType as Db;
    match self {
      Self::Tacotron2_5 => Db::GptSoVits,
      Self::HifiganTacotron2 => Db::HifiganTacotron2,
      Self::RvcV2 => Db::RvcV2,
      Self::StableDiffusion15 => Db::StableDiffusion15,
      Self::StableDiffusionXL => Db::StableDiffusionXL,
      Self::SoVitsSvc => Db::SoVitsSvc,
      Self::Tacotron2 => Db::Tacotron2,
      Self::LoRA => Db::LoRA,
      Self::VallE => Db::VallE,
      Self::ComfyUi => Db::ComfyUi,
    }
  }
}

#[cfg(test)]
mod tests {
  use strum::IntoEnumIterator;
  use enums_shared::test_helpers::to_json;
  use super::*;

  fn override_enums() -> &'static [WeightsType; 1] {
    &[WeightsType::Tacotron2_5]
  }

  mod override_values {
    use enums_db::by_table::model_weights::weights_types::WeightsType as Db;
    use super::*;

    #[test]
    fn gpt_so_vits() {
      assert_eq!(WeightsType::Tacotron2_5.to_db(), Db::GptSoVits);
      assert_eq!(to_json(&WeightsType::Tacotron2_5.to_db()), "gpt_so_vits");
      assert_eq!(WeightsType::from_db(Db::GptSoVits), WeightsType::Tacotron2_5);
      assert_eq!(to_json(&WeightsType::from_db(Db::GptSoVits)), "tacotron2.5");
    }
  }

  mod mechanical_checks {
    use enums_db::by_table::model_weights::weights_types::WeightsType as Db;
    use super::*;

    #[test]
    fn public_to_internal() {
      let mut tested_count = 0;
      for public_variant in WeightsType::iter() {
        if public_variant == WeightsType::Tacotron2_5 {
          continue;
        }
        assert_eq!(public_variant, WeightsType::from_db(public_variant.to_db()));
        let internal_enum_string = to_json(&public_variant.to_db());
        let public_enum_string = to_json(&public_variant);
        assert_eq!(internal_enum_string, public_enum_string);
        tested_count += 1;
      }
      assert!(tested_count > 1);
      assert_eq!(tested_count, WeightsType::iter().len() - override_enums().len());
    }

    #[test]
    fn internal_to_public() {
      let mut tested_count = 0;
      for internal_variant in Db::all_variants() {
        if internal_variant == Db::GptSoVits {
          continue;
        }
        assert_eq!(internal_variant, WeightsType::from_db(internal_variant).to_db());
        let public_enum_string = to_json(&WeightsType::from_db(internal_variant));
        let internal_enum_string = to_json(&internal_variant);
        assert_eq!(internal_enum_string, public_enum_string);
        tested_count += 1;
      }
      assert!(tested_count > 1);
      assert_eq!(tested_count, Db::all_variants().len() - override_enums().len());
    }

    #[test]
    fn str_round_trip() {
      for variant in Db::all_variants() {
        let variant = WeightsType::from_db(variant);
        assert_eq!(variant, WeightsType::from_str(variant.to_str()).unwrap());
      }
    }
  }
}
