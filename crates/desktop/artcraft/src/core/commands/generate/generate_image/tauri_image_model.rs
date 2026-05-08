use enums::common::generation::common_model_type::CommonModelType;
use serde_derive::Deserialize;

/// Unified image model enum covering text-to-image, image edit, and inpainting.
///
/// This is used in the Tauri command bridge.
/// Don't change the serializations without coordinating with the frontend.
#[derive(Deserialize, Debug, Copy, Clone)]
#[serde(rename_all = "snake_case")]
pub enum TauriImageModel {
  // Text-to-image models

  #[serde(rename = "flux_1_dev")]
  Flux1Dev,
  #[serde(rename = "flux_1_schnell")]
  Flux1Schnell,
  #[serde(rename = "flux_pro_11")]
  FluxPro11,
  #[serde(rename = "flux_pro_11_ultra")]
  FluxPro11Ultra,
  #[serde(rename = "grok_image")]
  GrokImage,
  #[serde(rename = "recraft_3")]
  Recraft3,
  #[serde(rename = "gpt_image_1")]
  GptImage1,
  #[serde(rename = "gpt_image_1p5")]
  GptImage1p5,
  #[serde(rename = "gpt_image_2")]
  GptImage2,
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
  #[serde(rename = "midjourney")]
  Midjourney,

  // Image edit models

  #[serde(rename = "flux_pro_kontext_max")]
  FluxProKontextMax,
  #[serde(rename = "qwen_edit_2511_angles")]
  QwenEdit2511Angles,
  #[serde(rename = "flux_2_lora_angles")]
  Flux2LoraAngles,

  // Inpainting models

  #[serde(rename = "flux_dev_juggernaut")]
  FluxDevJuggernaut,
  #[serde(rename = "flux_pro_1")]
  FluxPro1,
}

impl TauriImageModel {
  pub fn to_common_model_type(&self) -> CommonModelType {
    match self {
      Self::Flux1Dev => CommonModelType::Flux1Dev,
      Self::Flux1Schnell => CommonModelType::Flux1Schnell,
      Self::FluxPro11 => CommonModelType::FluxPro11,
      Self::FluxPro11Ultra => CommonModelType::FluxPro11Ultra,
      Self::GrokImage => CommonModelType::GrokImage,
      Self::Recraft3 => CommonModelType::Recraft3,
      Self::GptImage1 => CommonModelType::GptImage1,
      Self::GptImage1p5 => CommonModelType::GptImage1p5,
      Self::GptImage2 => CommonModelType::GptImage2,
      Self::Gemini25Flash => CommonModelType::NanoBanana,
      Self::NanoBanana => CommonModelType::NanoBanana,
      Self::NanoBanana2 => CommonModelType::NanoBanana2,
      Self::NanoBananaPro => CommonModelType::NanoBananaPro,
      Self::Seedream4 => CommonModelType::Seedream4,
      Self::Seedream4p5 => CommonModelType::Seedream4p5,
      Self::Seedream5Lite => CommonModelType::Seedream5Lite,
      Self::Midjourney => CommonModelType::Midjourney,
      Self::FluxProKontextMax => CommonModelType::FluxProKontextMax,
      Self::QwenEdit2511Angles => CommonModelType::QwenEdit2511Angles,
      Self::Flux2LoraAngles => CommonModelType::Flux2LoraAngles,
      Self::FluxDevJuggernaut => CommonModelType::FluxDevJuggernaut,
      Self::FluxPro1 => CommonModelType::FluxPro1,
    }
  }
}
