use std::collections::BTreeSet;

#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;
use utoipa::ToSchema;

/// NB: This will be used by a variety of tables (MySQL and sqlite)!
/// Keep the max length to 24 characters.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, PartialEq, Eq, Hash, Ord, PartialOrd, Serialize, Deserialize, ToSchema)]
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

impl_enum_display_and_debug_using_to_str!(ModelType);
impl_mysql_enum_coders!(ModelType);
impl_mysql_from_row!(ModelType);

// NB: We can derive `sqlx::Type` instead of using `impl_mysql_enum_coders`

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
      Self::GptImage1 => "gpt_image_1",
      Self::GptImage1p5 => "gpt_image_1p5",
      Self::GrokImage => "grok_image",
      Self::Recraft3 => "recraft_3",
      Self::SeedEdit3 => "seededit_3",
      Self::Qwen => "qwen",
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
      "gpt_image_1" => Ok(Self::GptImage1),
      "gpt_image_1p5" => Ok(Self::GptImage1p5),
      "grok_image" => Ok(Self::GrokImage),
      "recraft_3" => Ok(Self::Recraft3),
      "seededit_3" => Ok(Self::SeedEdit3),
      "qwen" => Ok(Self::Qwen),
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
      Self::GptImage1,
      Self::GptImage1p5,
      Self::GrokImage,
      Self::Recraft3,
      Self::SeedEdit3,
      Self::Qwen,
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
  use crate::common::model_type::ModelType;
  use crate::test_helpers::assert_serialization;

  mod explicit_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      // Image models
      assert_serialization(ModelType::Flux1Dev, "flux_1_dev");
      assert_serialization(ModelType::Flux1Schnell, "flux_1_schnell");
      assert_serialization(ModelType::FluxDevJuggernaut, "flux_dev_juggernaut");
      assert_serialization(ModelType::FluxPro1, "flux_pro_1");
      assert_serialization(ModelType::FluxPro11, "flux_pro_1p1");
      assert_serialization(ModelType::FluxPro11Ultra, "flux_pro_1p1_ultra");
      assert_serialization(ModelType::FluxProKontextMax, "flux_pro_kontext_max");
      assert_serialization(ModelType::GptImage1, "gpt_image_1");
      assert_serialization(ModelType::GptImage1p5, "gpt_image_1p5");
      assert_serialization(ModelType::GrokImage, "grok_image");
      assert_serialization(ModelType::Recraft3, "recraft_3");
      assert_serialization(ModelType::SeedEdit3, "seededit_3");
      assert_serialization(ModelType::Qwen, "qwen");
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
      // Video models
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
      // 3D Object generation models
      assert_serialization(ModelType::Hunyuan3d2_0, "hunyuan_3d_2p0");
      assert_serialization(ModelType::Hunyuan3d2_1, "hunyuan_3d_2p1");
      assert_serialization(ModelType::Hunyuan3d3, "hunyuan_3d_3");
      // Splat generation models (World Labs)
      assert_serialization(ModelType::Marble0p1Mini, "marble_0p1_mini");
      assert_serialization(ModelType::Marble0p1Plus, "marble_0p1_plus");
    }

    #[test]
    fn to_str() {
      // Image models
      assert_eq!(ModelType::Flux1Dev.to_str(), "flux_1_dev");
      assert_eq!(ModelType::Flux1Schnell.to_str(), "flux_1_schnell");
      assert_eq!(ModelType::FluxDevJuggernaut.to_str(), "flux_dev_juggernaut");
      assert_eq!(ModelType::FluxPro1.to_str(), "flux_pro_1");
      assert_eq!(ModelType::FluxPro11.to_str(), "flux_pro_1p1");
      assert_eq!(ModelType::FluxPro11Ultra.to_str(), "flux_pro_1p1_ultra");
      assert_eq!(ModelType::FluxProKontextMax.to_str(), "flux_pro_kontext_max");
      assert_eq!(ModelType::GptImage1.to_str(), "gpt_image_1");
      assert_eq!(ModelType::GptImage1p5.to_str(), "gpt_image_1p5");
      assert_eq!(ModelType::GrokImage.to_str(), "grok_image");
      assert_eq!(ModelType::Recraft3.to_str(), "recraft_3");
      assert_eq!(ModelType::SeedEdit3.to_str(), "seededit_3");
      assert_eq!(ModelType::Qwen.to_str(), "qwen");
      assert_eq!(ModelType::Gemini25Flash.to_str(), "gemini_25_flash");
      assert_eq!(ModelType::NanoBanana.to_str(), "nano_banana");
      assert_eq!(ModelType::NanoBanana2.to_str(), "nano_banana_2");
      assert_eq!(ModelType::NanoBananaPro.to_str(), "nano_banana_pro");
      assert_eq!(ModelType::Seedream4.to_str(), "seedream_4");
      assert_eq!(ModelType::Seedream4p5.to_str(), "seedream_4p5");
      assert_eq!(ModelType::Seedream5Lite.to_str(), "seedream_5_lite");
      assert_eq!(ModelType::Midjourney.to_str(), "midjourney");
      assert_eq!(ModelType::MidjourneyV6.to_str(), "midjourney_v6");
      assert_eq!(ModelType::MidjourneyV6p1.to_str(), "midjourney_v6p1");
      assert_eq!(ModelType::MidjourneyV6p1Raw.to_str(), "midjourney_v6p1_raw");
      assert_eq!(ModelType::MidjourneyV7.to_str(), "midjourney_v7");
      assert_eq!(ModelType::MidjourneyV7Draft.to_str(), "midjourney_v7_draft");
      assert_eq!(ModelType::MidjourneyV7DraftRaw.to_str(), "midjourney_v7_draft_raw");
      assert_eq!(ModelType::MidjourneyV7Raw.to_str(), "midjourney_v7_raw");

      // Video models
      assert_eq!(ModelType::GrokVideo.to_str(), "grok_video");
      assert_eq!(ModelType::Kling16Pro.to_str(), "kling_1p6_pro");
      assert_eq!(ModelType::Kling21Pro.to_str(), "kling_2p1_pro");
      assert_eq!(ModelType::Kling21Master.to_str(), "kling_2p1_master");
      assert_eq!(ModelType::Kling2p5TurboPro.to_str(), "kling_2p5_turbo_pro");
      assert_eq!(ModelType::Kling2p6Pro.to_str(), "kling_2p6_pro");
      assert_eq!(ModelType::Kling3p0Standard.to_str(), "kling_3p0_standard");
      assert_eq!(ModelType::Kling3p0Pro.to_str(), "kling_3p0_pro");
      assert_eq!(ModelType::Seedance10Lite.to_str(), "seedance_1p0_lite");
      assert_eq!(ModelType::Seedance10Pro.to_str(), "seedance_1p0_pro");
      assert_eq!(ModelType::Seedance1p5Pro.to_str(), "seedance_1p5_pro");
      assert_eq!(ModelType::Seedance2p0.to_str(), "seedance_2p0");
      assert_eq!(ModelType::Sora2.to_str(), "sora_2");
      assert_eq!(ModelType::Sora2Pro.to_str(), "sora_2_pro");
      assert_eq!(ModelType::Veo2.to_str(), "veo_2");
      assert_eq!(ModelType::Veo3.to_str(), "veo_3");
      assert_eq!(ModelType::Veo3Fast.to_str(), "veo_3_fast");
      assert_eq!(ModelType::Veo3p1.to_str(), "veo_3p1");
      assert_eq!(ModelType::Veo3p1Fast.to_str(), "veo_3p1_fast");

      // 3D Object generation models
      assert_eq!(ModelType::Hunyuan3d2_0.to_str(), "hunyuan_3d_2p0");
      assert_eq!(ModelType::Hunyuan3d2_1.to_str(), "hunyuan_3d_2p1");
      assert_eq!(ModelType::Hunyuan3d3.to_str(), "hunyuan_3d_3");
      // Splat generation models (World Labs)
      assert_eq!(ModelType::Marble0p1Mini.to_str(), "marble_0p1_mini");
      assert_eq!(ModelType::Marble0p1Plus.to_str(), "marble_0p1_plus");
    }

    #[test]
    fn from_str() {
      // Image models
      assert_eq!(ModelType::from_str("flux_1_dev").unwrap(), ModelType::Flux1Dev);
      assert_eq!(ModelType::from_str("flux_1_schnell").unwrap(), ModelType::Flux1Schnell);
      assert_eq!(ModelType::from_str("flux_dev_juggernaut").unwrap(), ModelType::FluxDevJuggernaut);
      assert_eq!(ModelType::from_str("flux_pro_1").unwrap(), ModelType::FluxPro1);
      assert_eq!(ModelType::from_str("flux_pro_1p1").unwrap(), ModelType::FluxPro11);
      assert_eq!(ModelType::from_str("flux_pro_1p1_ultra").unwrap(), ModelType::FluxPro11Ultra);
      assert_eq!(ModelType::from_str("flux_pro_kontext_max").unwrap(), ModelType::FluxProKontextMax);
      assert_eq!(ModelType::from_str("gpt_image_1").unwrap(), ModelType::GptImage1);
      assert_eq!(ModelType::from_str("gpt_image_1p5").unwrap(), ModelType::GptImage1p5);
      assert_eq!(ModelType::from_str("grok_image").unwrap(), ModelType::GrokImage);
      assert_eq!(ModelType::from_str("recraft_3").unwrap(), ModelType::Recraft3);
      assert_eq!(ModelType::from_str("seededit_3").unwrap(), ModelType::SeedEdit3);
      assert_eq!(ModelType::from_str("qwen").unwrap(), ModelType::Qwen);
      assert_eq!(ModelType::from_str("gemini_25_flash").unwrap(), ModelType::Gemini25Flash);
      assert_eq!(ModelType::from_str("nano_banana").unwrap(), ModelType::NanoBanana);
      assert_eq!(ModelType::from_str("nano_banana_2").unwrap(), ModelType::NanoBanana2);
      assert_eq!(ModelType::from_str("nano_banana_pro").unwrap(), ModelType::NanoBananaPro);
      assert_eq!(ModelType::from_str("seedream_4").unwrap(), ModelType::Seedream4);
      assert_eq!(ModelType::from_str("seedream_4p5").unwrap(), ModelType::Seedream4p5);
      assert_eq!(ModelType::from_str("seedream_5_lite").unwrap(), ModelType::Seedream5Lite);
      assert_eq!(ModelType::from_str("midjourney").unwrap(), ModelType::Midjourney);
      assert_eq!(ModelType::from_str("midjourney_v6").unwrap(), ModelType::MidjourneyV6);
      assert_eq!(ModelType::from_str("midjourney_v6p1").unwrap(), ModelType::MidjourneyV6p1);
      assert_eq!(ModelType::from_str("midjourney_v6p1_raw").unwrap(), ModelType::MidjourneyV6p1Raw);
      assert_eq!(ModelType::from_str("midjourney_v7").unwrap(), ModelType::MidjourneyV7);
      assert_eq!(ModelType::from_str("midjourney_v7_draft").unwrap(), ModelType::MidjourneyV7Draft);
      assert_eq!(ModelType::from_str("midjourney_v7_draft_raw").unwrap(), ModelType::MidjourneyV7DraftRaw);
      assert_eq!(ModelType::from_str("midjourney_v7_raw").unwrap(), ModelType::MidjourneyV7Raw);
      // Video models
      assert_eq!(ModelType::from_str("grok_video").unwrap(), ModelType::GrokVideo);
      assert_eq!(ModelType::from_str("kling_1p6_pro").unwrap(), ModelType::Kling16Pro);
      assert_eq!(ModelType::from_str("kling_2p1_pro").unwrap(), ModelType::Kling21Pro);
      assert_eq!(ModelType::from_str("kling_2p1_master").unwrap(), ModelType::Kling21Master);
      assert_eq!(ModelType::from_str("kling_2p5_turbo_pro").unwrap(), ModelType::Kling2p5TurboPro);
      assert_eq!(ModelType::from_str("kling_2p6_pro").unwrap(), ModelType::Kling2p6Pro);
      assert_eq!(ModelType::from_str("kling_3p0_standard").unwrap(), ModelType::Kling3p0Standard);
      assert_eq!(ModelType::from_str("kling_3p0_pro").unwrap(), ModelType::Kling3p0Pro);
      assert_eq!(ModelType::from_str("seedance_1p0_lite").unwrap(), ModelType::Seedance10Lite);
      assert_eq!(ModelType::from_str("seedance_1p0_pro").unwrap(), ModelType::Seedance10Pro);
      assert_eq!(ModelType::from_str("seedance_1p5_pro").unwrap(), ModelType::Seedance1p5Pro);
      assert_eq!(ModelType::from_str("seedance_2p0").unwrap(), ModelType::Seedance2p0);
      assert_eq!(ModelType::from_str("sora_2").unwrap(), ModelType::Sora2);
      assert_eq!(ModelType::from_str("sora_2_pro").unwrap(), ModelType::Sora2Pro);
      assert_eq!(ModelType::from_str("veo_2").unwrap(), ModelType::Veo2);
      assert_eq!(ModelType::from_str("veo_3").unwrap(), ModelType::Veo3);
      assert_eq!(ModelType::from_str("veo_3_fast").unwrap(), ModelType::Veo3Fast);
      assert_eq!(ModelType::from_str("veo_3p1").unwrap(), ModelType::Veo3p1);
      assert_eq!(ModelType::from_str("veo_3p1_fast").unwrap(), ModelType::Veo3p1Fast);
      
      // 3D Object generation models
      assert_eq!(ModelType::from_str("hunyuan_3d_2p0").unwrap(), ModelType::Hunyuan3d2_0);
      assert_eq!(ModelType::from_str("hunyuan_3d_2p1").unwrap(), ModelType::Hunyuan3d2_1);
      assert_eq!(ModelType::from_str("hunyuan_3d_3").unwrap(), ModelType::Hunyuan3d3);
      // Splat generation models (World Labs)
      assert_eq!(ModelType::from_str("marble_0p1_mini").unwrap(), ModelType::Marble0p1Mini);
      assert_eq!(ModelType::from_str("marble_0p1_plus").unwrap(), ModelType::Marble0p1Plus);
    }

    #[test]
    fn all_variants() {
      let mut variants = ModelType::all_variants();
      assert_eq!(variants.len(), 52);
      // Image models
      assert_eq!(variants.pop_first(), Some(ModelType::Flux1Dev));
      assert_eq!(variants.pop_first(), Some(ModelType::Flux1Schnell));
      assert_eq!(variants.pop_first(), Some(ModelType::FluxDevJuggernaut));
      assert_eq!(variants.pop_first(), Some(ModelType::FluxPro1));
      assert_eq!(variants.pop_first(), Some(ModelType::FluxPro11));
      assert_eq!(variants.pop_first(), Some(ModelType::FluxPro11Ultra));
      assert_eq!(variants.pop_first(), Some(ModelType::FluxProKontextMax));
      assert_eq!(variants.pop_first(), Some(ModelType::GptImage1));
      assert_eq!(variants.pop_first(), Some(ModelType::GptImage1p5));
      assert_eq!(variants.pop_first(), Some(ModelType::GrokImage));
      assert_eq!(variants.pop_first(), Some(ModelType::Recraft3));
      assert_eq!(variants.pop_first(), Some(ModelType::SeedEdit3));
      assert_eq!(variants.pop_first(), Some(ModelType::Qwen));
      assert_eq!(variants.pop_first(), Some(ModelType::Gemini25Flash));
      assert_eq!(variants.pop_first(), Some(ModelType::NanoBanana));
      assert_eq!(variants.pop_first(), Some(ModelType::NanoBanana2));
      assert_eq!(variants.pop_first(), Some(ModelType::NanoBananaPro));
      assert_eq!(variants.pop_first(), Some(ModelType::Seedream4));
      assert_eq!(variants.pop_first(), Some(ModelType::Seedream4p5));
      assert_eq!(variants.pop_first(), Some(ModelType::Seedream5Lite));
      assert_eq!(variants.pop_first(), Some(ModelType::Midjourney));
      assert_eq!(variants.pop_first(), Some(ModelType::MidjourneyV6));
      assert_eq!(variants.pop_first(), Some(ModelType::MidjourneyV6p1));
      assert_eq!(variants.pop_first(), Some(ModelType::MidjourneyV6p1Raw));
      assert_eq!(variants.pop_first(), Some(ModelType::MidjourneyV7));
      assert_eq!(variants.pop_first(), Some(ModelType::MidjourneyV7Draft));
      assert_eq!(variants.pop_first(), Some(ModelType::MidjourneyV7DraftRaw));
      assert_eq!(variants.pop_first(), Some(ModelType::MidjourneyV7Raw));
      // Video models
      assert_eq!(variants.pop_first(), Some(ModelType::GrokVideo));
      assert_eq!(variants.pop_first(), Some(ModelType::Kling16Pro));
      assert_eq!(variants.pop_first(), Some(ModelType::Kling21Pro));
      assert_eq!(variants.pop_first(), Some(ModelType::Kling21Master));
      assert_eq!(variants.pop_first(), Some(ModelType::Kling2p5TurboPro));
      assert_eq!(variants.pop_first(), Some(ModelType::Kling2p6Pro));
      assert_eq!(variants.pop_first(), Some(ModelType::Kling3p0Standard));
      assert_eq!(variants.pop_first(), Some(ModelType::Kling3p0Pro));
      assert_eq!(variants.pop_first(), Some(ModelType::Seedance10Lite));
      assert_eq!(variants.pop_first(), Some(ModelType::Seedance10Pro));
      assert_eq!(variants.pop_first(), Some(ModelType::Seedance1p5Pro));
      assert_eq!(variants.pop_first(), Some(ModelType::Seedance2p0));
      assert_eq!(variants.pop_first(), Some(ModelType::Sora2));
      assert_eq!(variants.pop_first(), Some(ModelType::Sora2Pro));
      assert_eq!(variants.pop_first(), Some(ModelType::Veo2));
      assert_eq!(variants.pop_first(), Some(ModelType::Veo3));
      assert_eq!(variants.pop_first(), Some(ModelType::Veo3Fast));
      assert_eq!(variants.pop_first(), Some(ModelType::Veo3p1));
      assert_eq!(variants.pop_first(), Some(ModelType::Veo3p1Fast));
      // 3D Object generation models
      assert_eq!(variants.pop_first(), Some(ModelType::Hunyuan3d2_0));
      assert_eq!(variants.pop_first(), Some(ModelType::Hunyuan3d2_1));
      assert_eq!(variants.pop_first(), Some(ModelType::Hunyuan3d3));
      // Splat generation models (World Labs)
      assert_eq!(variants.pop_first(), Some(ModelType::Marble0p1Mini));
      assert_eq!(variants.pop_first(), Some(ModelType::Marble0p1Plus));

      assert_eq!(variants.pop_first(), None);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn variant_length() {
      use strum::IntoEnumIterator;
      assert_eq!(ModelType::all_variants().len(), ModelType::iter().len());
    }

    #[test]
    fn round_trip() {
      for variant in ModelType::all_variants() {
        // Test to_str(), from_str(), Display, and Debug.
        assert_eq!(variant, ModelType::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, ModelType::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, ModelType::from_str(&format!("{:?}", variant)).unwrap());
      }
    }

    #[test]
    fn serialized_length_ok_for_database() {
      const MAX_LENGTH : usize = 24;
      for variant in ModelType::all_variants() {
        let serialized = variant.to_str();
        assert!(serialized.len() > 0, "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long", variant);
      }
    }
  }
}
