use serde::Serialize;

#[derive(Debug, Copy, Clone, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum GenerationServiceProvider {
  Artcraft,
  Fal,
  Sora,
}

#[derive(Debug, Copy, Clone, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum GenerationModel {
  #[serde(rename = "flux_1_dev")]
  Flux1Dev,
  #[serde(rename = "flux_1_schnell")]
  Flux1Schnell,
  #[serde(rename = "flux_pro_1.1")]
  FluxPro11,
  #[serde(rename = "flux_pro_1.1_ultra")]
  FluxPro11Ultra,
  #[serde(rename = "gpt_image_1")]
  GptImage1,
  #[serde(rename = "hunyuan_3d_2_0")]
  Hunyuan3d2_0,
  #[serde(rename = "hunyuan_3d_2_1")]
  Hunyuan3d2_1,
  #[serde(rename = "kling_1.6")]
  Kling1_6,
  #[serde(rename = "kling_2.0")]
  Kling2_0,
  #[serde(rename = "kling_2.1_master")]
  Kling21Master,
  #[serde(rename = "kling_2.1_pro")]
  Kling21Pro,
  #[serde(rename = "recraft_3")]
  Recraft3,
  #[serde(rename = "sora")]
  Sora,
  #[serde(rename = "seedance_1.0_lite")]
  Seedance10Lite,
  #[serde(rename = "veo_2")]
  Veo2,
}

#[derive(Debug, Copy, Clone, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum GenerationAction {
  GenerateImage,
  GenerateVideo,
  RemoveBackground,
  #[serde(rename = "image_to_3d")]
  ImageTo3d,
}
