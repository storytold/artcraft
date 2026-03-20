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

#[cfg(test)]
mod tests {
  use super::ModelType;
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn variants_count_check() {
      assert_eq!(ModelType::iter().count(), 54);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in ModelType::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: ModelType = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
