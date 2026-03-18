use std::path::PathBuf;

use enums::by_table::model_weights::weights_types::WeightsType;
use mysql_queries::queries::model_weights::get::get_weight::RetrievedModelWeight;
use tokens::tokens::model_weights::ModelWeightToken;

pub struct ModelWeightsCacheMapping {
  pub token: ModelWeightToken,
  pub weights_type: WeightsType,
}

impl ModelWeightsCacheMapping {

  pub fn new_from_model(model_weight: &RetrievedModelWeight) -> Self {
    Self::from_token_and_type(&model_weight.token, model_weight.weights_type)
  }

  pub fn from_token_and_type(token: &ModelWeightToken, weights_type: WeightsType) -> Self {
    Self {
      token: token.clone(),
      weights_type,
    }
  }


  pub fn to_path_buf(&self) -> PathBuf {
    let extension = self.extension();
    let filename = format!("{}.{}.{}", &self.token, self.weights_type, extension);
    PathBuf::from(filename)
  }


  fn extension(&self) -> &str {
    match self.weights_type {
      // Pt
      WeightsType::GptSoVits => "pt", // TODO(bt,2024-07-15): Is this correct?
      WeightsType::HifiganTacotron2 => "pt",
      WeightsType::RvcV2 => "pt",
      WeightsType::SoVitsSvc => "pt",
      WeightsType::Tacotron2 => "pt",
      WeightsType::VallE => "pt",
      // Safetensors
      WeightsType::StableDiffusion15 => "safetensors",
      WeightsType::StableDiffusionXL => "safetensors",
      WeightsType::LoRA => "safetensors",
      // Json
      WeightsType::ComfyUi => "json",
    }
  }
}

#[cfg(test)]
mod tests {
  use std::path::PathBuf;

  use enums::by_table::model_weights::weights_types::WeightsType;
  use tokens::tokens::model_weights::ModelWeightToken;

  use crate::util::model_weights_cache::model_weights_cache_filename::ModelWeightsCacheMapping;

  #[test]
  fn stable_diffusion_checkpoints() {
    let mapper = ModelWeightsCacheMapping::from_token_and_type(
      &ModelWeightToken::new_from_str("test_token"),
      WeightsType::StableDiffusion15
    );
    let path = mapper.to_path_buf();

    assert_eq!(path, PathBuf::from("test_token.sd_1.5.safetensors"));
  }

  #[test]
  fn lora_checkpoints() {
    let mapper = ModelWeightsCacheMapping::from_token_and_type(
      &ModelWeightToken::new_from_str("test_lora"),
      WeightsType::LoRA
    );
    let path = mapper.to_path_buf();

    assert_eq!(path, PathBuf::from("test_lora.loRA.safetensors"));
  }
}