use serde::Serialize;

#[derive(Debug, Copy, Clone, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum GenerationServiceProvider {
  Artcraft,
  Fal,
  Grok,
  Midjourney,
  Sora,
  WorldLabs,
}

#[derive(Debug, Copy, Clone, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum GenerationModel {
  #[serde(rename = "flux_1_dev")]
  Flux1Dev,
  #[serde(rename = "flux_1_schnell")]
  Flux1Schnell,
  #[serde(rename = "flux_dev_juggernaut")]
  FluxDevJuggernaut,
  #[serde(rename = "flux_pro_1")]
  FluxPro1,
  #[serde(rename = "flux_pro_1.1")]
  FluxPro11,
  #[serde(rename = "flux_pro_1.1_ultra")]
  FluxPro11Ultra,
  
  #[serde(rename = "flux_pro_kontext_max")]
  FluxProKontextMax,
  #[serde(rename = "gpt_image_1")]
  GptImage1,
  #[serde(rename = "gpt_image_1p5")]
  GptImage1p5,
  #[serde(rename = "grok_image")]
  GrokImage,
  #[serde(rename = "gemini_25_flash")]
  Gemini25Flash,
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

  #[serde(rename = "qwen_edit_2511_angles")]
  QwenEdit2511Angles,
  #[serde(rename = "flux_2_lora_angles")]
  Flux2LoraAngles,

  #[serde(rename = "hunyuan_3d_2_0")]
  Hunyuan3d2_0,
  #[serde(rename = "hunyuan_3d_2_1")]
  Hunyuan3d2_1,
  #[serde(rename = "hunyuan_3d_3")]
  Hunyuan3d3,

  #[serde(rename = "worldlabs_marble")]
  WorldlabsMarble,
  #[serde(rename = "worldlabs_marble_0p1_mini")]
  WorldlabsMarble0p1Mini,
  #[serde(rename = "worldlabs_marble_0p1_plus")]
  WorldlabsMarble0p1Plus,

  // Generic Midjourney model, version unknown.
  #[serde(rename = "midjourney")]
  Midjourney,

  // Generic Grok video model, version unknown.
  #[serde(rename = "grok_video")]
  GrokVideo,
  // TODO: Should be Kling16Pro
  #[serde(rename = "kling_1.6")]
  Kling1_6,
  #[serde(rename = "kling_2.0")]
  Kling2_0,
  #[serde(rename = "kling_2.1_master")]
  Kling21Master,
  #[serde(rename = "kling_2.1_pro")]
  Kling21Pro,
  #[serde(rename = "kling_2p5_turbo_pro")]
  Kling2p5TurboPro,
  #[serde(rename = "kling_2p6_pro")]
  Kling2p6Pro,
  #[serde(rename = "kling_3p0_standard")]
  Kling3p0Standard,
  #[serde(rename = "kling_3p0_pro")]
  Kling3p0Pro,
  #[serde(rename = "recraft_3")]
  Recraft3,
  #[serde(rename = "sora")]
  Sora,
  #[serde(rename = "sora_2")]
  Sora2,
  #[serde(rename = "sora_2_pro")]
  Sora2Pro,
  #[serde(rename = "seedance_1.0_lite")]
  Seedance10Lite,
  #[serde(rename = "seedance_1p5_pro")]
  Seedance1p5Pro,
  #[serde(rename = "seedance_2p0")]
  Seedance2p0,
  #[serde(rename = "veo_2")]
  Veo2,
  #[serde(rename = "veo_3")]
  Veo3,
  #[serde(rename = "veo_3_fast")]
  Veo3Fast,
  #[serde(rename = "veo_3p1")]
  Veo3p1,
  #[serde(rename = "veo_3p1_fast")]
  Veo3p1Fast,
}

#[derive(Debug, Copy, Clone, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum GenerationAction {
  GenerateImage,
  GenerateVideo,
  RemoveBackground,
  #[serde(rename = "image_to_3d")]
  ImageTo3d,
  GenerateGaussian,
  #[serde(rename = "image_inpaint_edit")]
  ImageInpaintEdit,
}
