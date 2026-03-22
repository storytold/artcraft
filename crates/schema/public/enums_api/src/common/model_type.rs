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
  use enums_shared::test_helpers::{assert_deserialization, assert_serialization};
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(ModelType::Flux1Dev, "flux_1_dev");
      assert_serialization(ModelType::Flux1Schnell, "flux_1_schnell");
      assert_serialization(ModelType::FluxDevJuggernaut, "flux_dev_juggernaut");
      assert_serialization(ModelType::FluxPro1, "flux_pro_1");
      assert_serialization(ModelType::FluxPro11, "flux_pro_1p1");
      assert_serialization(ModelType::FluxPro11Ultra, "flux_pro_1p1_ultra");
      assert_serialization(ModelType::FluxProKontextMax, "flux_pro_kontext_max");
      assert_serialization(ModelType::Flux2LoraAngles, "flux_2_lora_angles");
      assert_serialization(ModelType::GptImage1, "gpt_image_1");
      assert_serialization(ModelType::GptImage1p5, "gpt_image_1p5");
      assert_serialization(ModelType::GrokImage, "grok_image");
      assert_serialization(ModelType::Recraft3, "recraft_3");
      assert_serialization(ModelType::SeedEdit3, "seededit_3");
      assert_serialization(ModelType::Qwen, "qwen");
      assert_serialization(ModelType::QwenEdit2511Angles, "qwen_edit_2511_angles");
      assert_serialization(ModelType::Gemini25Flash, "gemini_25_flash");
      assert_serialization(ModelType::NanoBanana, "nano_banana");
      assert_serialization(ModelType::NanoBanana2, "nano_banana_2");
      assert_serialization(ModelType::NanoBananaPro, "nano_banana_pro");
      assert_serialization(ModelType::Seedream4, "seedream_4");
      assert_serialization(ModelType::Seedream4p5, "seedream_4p5");
      assert_serialization(ModelType::Seedream5Lite, "seedream_5_lite");
      assert_serialization(ModelType::Midjourney, "midjourney");
      assert_serialization(ModelType::MidjourneyV6, "midjourney_v6");
      assert_serialization(ModelType::MidjourneyV6p1, "midjourney_v6p1");
      assert_serialization(ModelType::MidjourneyV6p1Raw, "midjourney_v6p1_raw");
      assert_serialization(ModelType::MidjourneyV7, "midjourney_v7");
      assert_serialization(ModelType::MidjourneyV7Draft, "midjourney_v7_draft");
      assert_serialization(ModelType::MidjourneyV7DraftRaw, "midjourney_v7_draft_raw");
      assert_serialization(ModelType::MidjourneyV7Raw, "midjourney_v7_raw");
      assert_serialization(ModelType::GrokVideo, "grok_video");
      assert_serialization(ModelType::Kling16Pro, "kling_1p6_pro");
      assert_serialization(ModelType::Kling21Pro, "kling_2p1_pro");
      assert_serialization(ModelType::Kling21Master, "kling_2p1_master");
      assert_serialization(ModelType::Kling2p5TurboPro, "kling_2p5_turbo_pro");
      assert_serialization(ModelType::Kling2p6Pro, "kling_2p6_pro");
      assert_serialization(ModelType::Kling3p0Standard, "kling_3p0_standard");
      assert_serialization(ModelType::Kling3p0Pro, "kling_3p0_pro");
      assert_serialization(ModelType::Seedance10Lite, "seedance_1p0_lite");
      assert_serialization(ModelType::Seedance10Pro, "seedance_1p0_pro");
      assert_serialization(ModelType::Seedance1p5Pro, "seedance_1p5_pro");
      assert_serialization(ModelType::Seedance2p0, "seedance_2p0");
      assert_serialization(ModelType::Sora2, "sora_2");
      assert_serialization(ModelType::Sora2Pro, "sora_2_pro");
      assert_serialization(ModelType::Veo2, "veo_2");
      assert_serialization(ModelType::Veo3, "veo_3");
      assert_serialization(ModelType::Veo3Fast, "veo_3_fast");
      assert_serialization(ModelType::Veo3p1, "veo_3p1");
      assert_serialization(ModelType::Veo3p1Fast, "veo_3p1_fast");
      assert_serialization(ModelType::Hunyuan3d2_0, "hunyuan_3d_2p0");
      assert_serialization(ModelType::Hunyuan3d2_1, "hunyuan_3d_2p1");
      assert_serialization(ModelType::Hunyuan3d3, "hunyuan_3d_3");
      assert_serialization(ModelType::Marble0p1Mini, "marble_0p1_mini");
      assert_serialization(ModelType::Marble0p1Plus, "marble_0p1_plus");
    }

    #[test]
    fn test_deserialization() {
      assert_deserialization("flux_1_dev", ModelType::Flux1Dev);
      assert_deserialization("flux_1_schnell", ModelType::Flux1Schnell);
      assert_deserialization("flux_dev_juggernaut", ModelType::FluxDevJuggernaut);
      assert_deserialization("flux_pro_1", ModelType::FluxPro1);
      assert_deserialization("flux_pro_1p1", ModelType::FluxPro11);
      assert_deserialization("flux_pro_1p1_ultra", ModelType::FluxPro11Ultra);
      assert_deserialization("flux_pro_kontext_max", ModelType::FluxProKontextMax);
      assert_deserialization("flux_2_lora_angles", ModelType::Flux2LoraAngles);
      assert_deserialization("gpt_image_1", ModelType::GptImage1);
      assert_deserialization("gpt_image_1p5", ModelType::GptImage1p5);
      assert_deserialization("grok_image", ModelType::GrokImage);
      assert_deserialization("recraft_3", ModelType::Recraft3);
      assert_deserialization("seededit_3", ModelType::SeedEdit3);
      assert_deserialization("qwen", ModelType::Qwen);
      assert_deserialization("qwen_edit_2511_angles", ModelType::QwenEdit2511Angles);
      assert_deserialization("gemini_25_flash", ModelType::Gemini25Flash);
      assert_deserialization("nano_banana", ModelType::NanoBanana);
      assert_deserialization("nano_banana_2", ModelType::NanoBanana2);
      assert_deserialization("nano_banana_pro", ModelType::NanoBananaPro);
      assert_deserialization("seedream_4", ModelType::Seedream4);
      assert_deserialization("seedream_4p5", ModelType::Seedream4p5);
      assert_deserialization("seedream_5_lite", ModelType::Seedream5Lite);
      assert_deserialization("midjourney", ModelType::Midjourney);
      assert_deserialization("midjourney_v6", ModelType::MidjourneyV6);
      assert_deserialization("midjourney_v6p1", ModelType::MidjourneyV6p1);
      assert_deserialization("midjourney_v6p1_raw", ModelType::MidjourneyV6p1Raw);
      assert_deserialization("midjourney_v7", ModelType::MidjourneyV7);
      assert_deserialization("midjourney_v7_draft", ModelType::MidjourneyV7Draft);
      assert_deserialization("midjourney_v7_draft_raw", ModelType::MidjourneyV7DraftRaw);
      assert_deserialization("midjourney_v7_raw", ModelType::MidjourneyV7Raw);
      assert_deserialization("grok_video", ModelType::GrokVideo);
      assert_deserialization("kling_1p6_pro", ModelType::Kling16Pro);
      assert_deserialization("kling_2p1_pro", ModelType::Kling21Pro);
      assert_deserialization("kling_2p1_master", ModelType::Kling21Master);
      assert_deserialization("kling_2p5_turbo_pro", ModelType::Kling2p5TurboPro);
      assert_deserialization("kling_2p6_pro", ModelType::Kling2p6Pro);
      assert_deserialization("kling_3p0_standard", ModelType::Kling3p0Standard);
      assert_deserialization("kling_3p0_pro", ModelType::Kling3p0Pro);
      assert_deserialization("seedance_1p0_lite", ModelType::Seedance10Lite);
      assert_deserialization("seedance_1p0_pro", ModelType::Seedance10Pro);
      assert_deserialization("seedance_1p5_pro", ModelType::Seedance1p5Pro);
      assert_deserialization("seedance_2p0", ModelType::Seedance2p0);
      assert_deserialization("sora_2", ModelType::Sora2);
      assert_deserialization("sora_2_pro", ModelType::Sora2Pro);
      assert_deserialization("veo_2", ModelType::Veo2);
      assert_deserialization("veo_3", ModelType::Veo3);
      assert_deserialization("veo_3_fast", ModelType::Veo3Fast);
      assert_deserialization("veo_3p1", ModelType::Veo3p1);
      assert_deserialization("veo_3p1_fast", ModelType::Veo3p1Fast);
      assert_deserialization("hunyuan_3d_2p0", ModelType::Hunyuan3d2_0);
      assert_deserialization("hunyuan_3d_2p1", ModelType::Hunyuan3d2_1);
      assert_deserialization("hunyuan_3d_3", ModelType::Hunyuan3d3);
      assert_deserialization("marble_0p1_mini", ModelType::Marble0p1Mini);
      assert_deserialization("marble_0p1_plus", ModelType::Marble0p1Plus);
    }

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
