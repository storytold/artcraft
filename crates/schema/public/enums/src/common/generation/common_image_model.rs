use utoipa::ToSchema;

/// Image models available for generation.
/// Mirrors artcraft_router::api::common_image_model::CommonImageModel.
#[derive(Copy, Clone, Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum CommonImageModel {
  #[serde(rename = "flux_1_dev")]
  Flux1Dev,
  #[serde(rename = "flux_1_schnell")]
  Flux1Schnell,
  #[serde(rename = "flux_pro_1p1")]
  FluxPro11,
  #[serde(rename = "flux_pro_1p1_ultra")]
  FluxPro11Ultra,
  #[serde(rename = "gpt_image_1p5")]
  GptImage1p5,
  #[serde(rename = "nano_banana")]
  NanoBanana,
  #[serde(rename = "nano_banana_2")]
  NanoBanana2,
  #[serde(rename = "nano_banana_pro")]
  NanoBananaPro,
  #[serde(rename = "seedream_4")]
  Seedream4,
  #[serde(rename = "seedream_4p5")]
  Seedream4p5,
  #[serde(rename = "seedream_5_lite")]
  Seedream5Lite,
}

impl CommonImageModel {
  pub fn to_common_model_type(&self) -> crate::common::generation::common_model_type::CommonModelType {
    use crate::common::generation::common_model_type::CommonModelType;
    match self {
      Self::Flux1Dev => CommonModelType::Flux1Dev,
      Self::Flux1Schnell => CommonModelType::Flux1Schnell,
      Self::FluxPro11 => CommonModelType::FluxPro11,
      Self::FluxPro11Ultra => CommonModelType::FluxPro11Ultra,
      Self::GptImage1p5 => CommonModelType::GptImage1p5,
      Self::NanoBanana => CommonModelType::NanoBanana,
      Self::NanoBanana2 => CommonModelType::NanoBanana2,
      Self::NanoBananaPro => CommonModelType::NanoBananaPro,
      Self::Seedream4 => CommonModelType::Seedream4,
      Self::Seedream4p5 => CommonModelType::Seedream4p5,
      Self::Seedream5Lite => CommonModelType::Seedream5Lite,
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::common::generation::common_model_type::CommonModelType;

  #[test]
  fn all_image_models_convert_to_common_model_type() {
    let models = [
      (CommonImageModel::Flux1Dev, CommonModelType::Flux1Dev),
      (CommonImageModel::Flux1Schnell, CommonModelType::Flux1Schnell),
      (CommonImageModel::FluxPro11, CommonModelType::FluxPro11),
      (CommonImageModel::FluxPro11Ultra, CommonModelType::FluxPro11Ultra),
      (CommonImageModel::GptImage1p5, CommonModelType::GptImage1p5),
      (CommonImageModel::NanoBanana, CommonModelType::NanoBanana),
      (CommonImageModel::NanoBanana2, CommonModelType::NanoBanana2),
      (CommonImageModel::NanoBananaPro, CommonModelType::NanoBananaPro),
      (CommonImageModel::Seedream4, CommonModelType::Seedream4),
      (CommonImageModel::Seedream4p5, CommonModelType::Seedream4p5),
      (CommonImageModel::Seedream5Lite, CommonModelType::Seedream5Lite),
    ];
    for (image_model, expected) in models {
      assert_eq!(image_model.to_common_model_type(), expected);
    }
  }
}
