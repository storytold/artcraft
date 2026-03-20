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

impl WeightsType {
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
}
