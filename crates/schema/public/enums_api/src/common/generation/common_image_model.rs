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
  NanaBanana,
  #[serde(rename = "nano_banana_2")]
  NanaBanana2,
  #[serde(rename = "nano_banana_pro")]
  NanaBananaPro,
  #[serde(rename = "seedream_4")]
  Seedream4,
  #[serde(rename = "seedream_4p5")]
  Seedream4p5,
  #[serde(rename = "seedream_5_lite")]
  Seedream5Lite,
}
