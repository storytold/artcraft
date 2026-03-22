use std::collections::BTreeSet;

use strum::EnumIter;
use utoipa::ToSchema;

/// NB: This will be used by a variety of tables (MySQL and sqlite)!
/// Keep the max length to 24 characters.
#[derive(Clone, Debug, Copy, PartialEq, Eq, Hash, Ord, PartialOrd, Serialize, EnumIter, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum ModelType {
  // Image models
  #[serde(rename = "flux_1_dev")]
  Flux1Dev,
  #[serde(rename = "flux_1_schnell")]
  Flux1Schnell,
  #[serde(rename = "flux_dev_juggernaut")]
  FluxDevJuggernaut,
  #[serde(rename = "flux_pro_1")]
  FluxPro1,
  #[serde(rename = "flux_pro_1p1")]
  FluxPro11,
  #[serde(rename = "flux_pro_1p1_ultra")]
  FluxPro11Ultra,
  #[serde(rename = "flux_pro_kontext_max")]
  FluxProKontextMax,
  #[serde(rename = "flux_2_lora_angles")]
  Flux2LoraAngles,
  #[serde(rename = "gpt_image_1")]
  GptImage1,
  #[serde(rename = "gpt_image_1p5")]
  GptImage1p5,
  // Generic grok image model without a version
  #[serde(rename = "grok_image")]
  GrokImage,
  #[serde(rename = "recraft_3")]
  Recraft3,
  #[serde(rename = "seededit_3")]
  SeedEdit3,
  #[serde(rename = "qwen")]
  Qwen,
  #[serde(rename = "qwen_edit_2511_angles")]
  QwenEdit2511Angles,
  /// Gemini 2.5 Flash, AKA "Nano Banana"
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

  /// Midjourney without distinguishing a model type or version
  #[serde(rename = "midjourney")]
  Midjourney,
  #[serde(rename = "midjourney_v6")]
  MidjourneyV6,
  #[serde(rename = "midjourney_v6p1")]
  MidjourneyV6p1,
  #[serde(rename = "midjourney_v6p1_raw")]
  MidjourneyV6p1Raw,
  #[serde(rename = "midjourney_v7")]
  MidjourneyV7,
  #[serde(rename = "midjourney_v7_draft")]
  MidjourneyV7Draft,
  #[serde(rename = "midjourney_v7_draft_raw")]
  MidjourneyV7DraftRaw,
  #[serde(rename = "midjourney_v7_raw")]
  MidjourneyV7Raw,

  //// Image Infill models
  //#[serde(rename = "flux_pro_1_infill")]
  //FluxPro1Infill,

  // Video models
  
  // Generic grok video model without a version
  #[serde(rename = "grok_video")]
  GrokVideo, 
  #[serde(rename = "kling_1p6_pro")]
  Kling16Pro,
  #[serde(rename = "kling_2p1_pro")]
  Kling21Pro,
  #[serde(rename = "kling_2p1_master")]
  Kling21Master,
  #[serde(rename = "kling_2p5_turbo_pro")]
  Kling2p5TurboPro,
  #[serde(rename = "kling_2p6_pro")]
  Kling2p6Pro,
  #[serde(rename = "kling_3p0_standard")]
  Kling3p0Standard,
  #[serde(rename = "kling_3p0_pro")]
  Kling3p0Pro,
  #[serde(rename = "seedance_1p0_lite")]
  Seedance10Lite,
  #[serde(rename = "seedance_1p0_pro")]
  Seedance10Pro,
  #[serde(rename = "seedance_1p5_pro")]
  Seedance1p5Pro,
  #[serde(rename = "seedance_2p0")]
  Seedance2p0,
  #[serde(rename = "sora_2")]
  Sora2,
  #[serde(rename = "sora_2_pro")]
  Sora2Pro,
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

  // 3D Object generation models
  #[serde(rename = "hunyuan_3d_2p0")]
  Hunyuan3d2_0,
  #[serde(rename = "hunyuan_3d_2p1")]
  Hunyuan3d2_1,
  #[serde(rename = "hunyuan_3d_3")]
  Hunyuan3d3,

  // Splat generation models (World Labs)
  #[serde(rename = "marble_0p1_mini")]
  Marble0p1Mini,
  #[serde(rename = "marble_0p1_plus")]
  Marble0p1Plus,
}



impl ModelType {
  pub fn to_str(&self) -> &'static str {
    match self {
      // Image models
      Self::Flux1Dev => "flux_1_dev",
      Self::Flux1Schnell => "flux_1_schnell",
      Self::FluxDevJuggernaut => "flux_dev_juggernaut",
      Self::FluxPro1 => "flux_pro_1",
      Self::FluxPro11 => "flux_pro_1p1",
      Self::FluxPro11Ultra => "flux_pro_1p1_ultra",
      Self::FluxProKontextMax => "flux_pro_kontext_max",
      Self::Flux2LoraAngles => "flux_2_lora_angles",
      Self::GptImage1 => "gpt_image_1",
      Self::GptImage1p5 => "gpt_image_1p5",
      Self::GrokImage => "grok_image",
      Self::Recraft3 => "recraft_3",
      Self::SeedEdit3 => "seededit_3",
      Self::Qwen => "qwen",
      Self::QwenEdit2511Angles => "qwen_edit_2511_angles",
      Self::Gemini25Flash => "gemini_25_flash",
      Self::NanoBanana => "nano_banana",
      Self::NanoBanana2 => "nano_banana_2",
      Self::NanoBananaPro => "nano_banana_pro",
      Self::Seedream4 => "seedream_4",
      Self::Seedream4p5 => "seedream_4p5",
      Self::Seedream5Lite => "seedream_5_lite",
      Self::Midjourney => "midjourney",
      Self::MidjourneyV6 => "midjourney_v6",
      Self::MidjourneyV6p1 => "midjourney_v6p1",
      Self::MidjourneyV6p1Raw => "midjourney_v6p1_raw",
      Self::MidjourneyV7 => "midjourney_v7",
      Self::MidjourneyV7Draft => "midjourney_v7_draft",
      Self::MidjourneyV7DraftRaw => "midjourney_v7_draft_raw",
      Self::MidjourneyV7Raw => "midjourney_v7_raw",

      // Video models
      Self::GrokVideo => "grok_video",
      Self::Kling16Pro => "kling_1p6_pro",
      Self::Kling21Pro => "kling_2p1_pro",
      Self::Kling21Master => "kling_2p1_master",
      Self::Kling2p5TurboPro => "kling_2p5_turbo_pro",
      Self::Kling2p6Pro => "kling_2p6_pro",
      Self::Kling3p0Standard => "kling_3p0_standard",
      Self::Kling3p0Pro => "kling_3p0_pro",
      Self::Seedance10Lite => "seedance_1p0_lite",
      Self::Seedance10Pro => "seedance_1p0_pro",
      Self::Seedance1p5Pro => "seedance_1p5_pro",
      Self::Seedance2p0 => "seedance_2p0",
      Self::Sora2 => "sora_2",
      Self::Sora2Pro => "sora_2_pro",
      Self::Veo2 => "veo_2",
      Self::Veo3 => "veo_3",
      Self::Veo3Fast => "veo_3_fast",
      Self::Veo3p1 => "veo_3p1",
      Self::Veo3p1Fast => "veo_3p1_fast",

      // 3D Object generation models
      Self::Hunyuan3d2_0 => "hunyuan_3d_2p0",
      Self::Hunyuan3d2_1 => "hunyuan_3d_2p1",
      Self::Hunyuan3d3 => "hunyuan_3d_3",

      // Splat generation models (World Labs)
      Self::Marble0p1Mini => "marble_0p1_mini",
      Self::Marble0p1Plus => "marble_0p1_plus",
    }
  }

  pub fn from_str(job_status: &str) -> Result<Self, String> {
    match job_status {
      // Image models
      "flux_1_dev" => Ok(Self::Flux1Dev),
      "flux_1_schnell" => Ok(Self::Flux1Schnell),
      "flux_dev_juggernaut" => Ok(Self::FluxDevJuggernaut),
      "flux_pro_1" => Ok(Self::FluxPro1),
      "flux_pro_1p1" => Ok(Self::FluxPro11),
      "flux_pro_1p1_ultra" => Ok(Self::FluxPro11Ultra),
      "flux_pro_kontext_max" => Ok(Self::FluxProKontextMax),
      "flux_2_lora_angles" => Ok(Self::Flux2LoraAngles),
      "gpt_image_1" => Ok(Self::GptImage1),
      "gpt_image_1p5" => Ok(Self::GptImage1p5),
      "grok_image" => Ok(Self::GrokImage),
      "recraft_3" => Ok(Self::Recraft3),
      "seededit_3" => Ok(Self::SeedEdit3),
      "qwen" => Ok(Self::Qwen),
      "qwen_edit_2511_angles" => Ok(Self::QwenEdit2511Angles),
      "gemini_25_flash" => Ok(Self::Gemini25Flash),
      "nano_banana" => Ok(Self::NanoBanana),
      "nano_banana_2" => Ok(Self::NanoBanana2),
      "nano_banana_pro" => Ok(Self::NanoBananaPro),
      "seedream_4" => Ok(Self::Seedream4),
      "seedream_4p5" => Ok(Self::Seedream4p5),
      "seedream_5_lite" => Ok(Self::Seedream5Lite),
      "midjourney" => Ok(Self::Midjourney),
      "midjourney_v6" => Ok(Self::MidjourneyV6),
      "midjourney_v6p1" => Ok(Self::MidjourneyV6p1),
      "midjourney_v6p1_raw" => Ok(Self::MidjourneyV6p1Raw),
      "midjourney_v7" => Ok(Self::MidjourneyV7),
      "midjourney_v7_draft" => Ok(Self::MidjourneyV7Draft),
      "midjourney_v7_draft_raw" => Ok(Self::MidjourneyV7DraftRaw),
      "midjourney_v7_raw" => Ok(Self::MidjourneyV7Raw),

      // Video models
      "grok_video" => Ok(Self::GrokVideo),
      "kling_1p6_pro" => Ok(Self::Kling16Pro),
      "kling_2p1_pro" => Ok(Self::Kling21Pro),
      "kling_2p1_master" => Ok(Self::Kling21Master),
      "kling_2p5_turbo_pro" => Ok(Self::Kling2p5TurboPro),
      "kling_2p6_pro" => Ok(Self::Kling2p6Pro),
      "kling_3p0_standard" => Ok(Self::Kling3p0Standard),
      "kling_3p0_pro" => Ok(Self::Kling3p0Pro),
      "seedance_1p0_lite" => Ok(Self::Seedance10Lite),
      "seedance_1p0_pro" => Ok(Self::Seedance10Pro),
      "seedance_1p5_pro" => Ok(Self::Seedance1p5Pro),
      "seedance_2p0" => Ok(Self::Seedance2p0),
      "sora_2" => Ok(Self::Sora2),
      "sora_2_pro" => Ok(Self::Sora2Pro),
      "veo_2" => Ok(Self::Veo2),
      "veo_3" => Ok(Self::Veo3),
      "veo_3_fast" => Ok(Self::Veo3Fast),
      "veo_3p1" => Ok(Self::Veo3p1),
      "veo_3p1_fast" => Ok(Self::Veo3p1Fast),

      // 3D Object generation models
      "hunyuan_3d_2p0" => Ok(Self::Hunyuan3d2_0),
      "hunyuan_3d_2p1" => Ok(Self::Hunyuan3d2_1),
      "hunyuan_3d_3" => Ok(Self::Hunyuan3d3),

      // Splat generation models (World Labs)
      "marble_0p1_mini" => Ok(Self::Marble0p1Mini),
      "marble_0p1_plus" => Ok(Self::Marble0p1Plus),

      _ => Err(format!("invalid model_type: {:?}", job_status)),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    // NB: BTreeSet is sorted
    // NB: BTreeSet::from() isn't const, but not worth using LazyStatic, etc.
    BTreeSet::from([
      // Image models
      Self::Flux1Dev,
      Self::Flux1Schnell,
      Self::FluxDevJuggernaut,
      Self::FluxPro1,
      Self::FluxPro11,
      Self::FluxPro11Ultra,
      Self::FluxProKontextMax,
      Self::Flux2LoraAngles,
      Self::GptImage1,
      Self::GptImage1p5,
      Self::GrokImage,
      Self::Recraft3,
      Self::SeedEdit3,
      Self::Qwen,
      Self::QwenEdit2511Angles,
      Self::Gemini25Flash,
      Self::NanoBanana,
      Self::NanoBanana2,
      Self::NanoBananaPro,
      Self::Seedream4,
      Self::Seedream4p5,
      Self::Seedream5Lite,
      Self::Midjourney,
      Self::MidjourneyV6,
      Self::MidjourneyV6p1,
      Self::MidjourneyV6p1Raw,
      Self::MidjourneyV7,
      Self::MidjourneyV7Draft,
      Self::MidjourneyV7DraftRaw,
      Self::MidjourneyV7Raw,

      // Video models
      Self::GrokVideo,
      Self::Kling16Pro,
      Self::Kling21Pro,
      Self::Kling21Master,
      Self::Kling2p5TurboPro,
      Self::Kling2p6Pro,
      Self::Kling3p0Standard,
      Self::Kling3p0Pro,
      Self::Seedance10Lite,
      Self::Seedance10Pro,
      Self::Seedance1p5Pro,
      Self::Seedance2p0,
      Self::Sora2,
      Self::Sora2Pro,
      Self::Veo2,
      Self::Veo3,
      Self::Veo3Fast,
      Self::Veo3p1,
      Self::Veo3p1Fast,

      // 3D Object generation models
      Self::Hunyuan3d2_0,
      Self::Hunyuan3d2_1,
      Self::Hunyuan3d3,

      // Splat generation models (World Labs)
      Self::Marble0p1Mini,
      Self::Marble0p1Plus,
    ])
  }
}

#[cfg(test)]
mod tests {
  use super::ModelType;
  use strum::IntoEnumIterator;

  #[test]
  fn round_trip_json() {
    for variant in ModelType::iter() {
      let json = serde_json::to_string(&variant).unwrap();
      let back: ModelType = serde_json::from_str(&json).unwrap();
      assert_eq!(variant, back);
    }
  }
}
