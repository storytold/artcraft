use std::collections::BTreeSet;

#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;
use utoipa::ToSchema;

use crate::common::generation::common_model_class::CommonModelClass;

/// Maximum serialized string length for database storage.
/// Stored in the `prompts` table (`maybe_model_type` column) as VARCHAR(24).
pub const MAX_LENGTH: usize = 24;

/// Common model type enum used across image, video, 3D, and splat generation.
/// This forms part of our core data model for generative models.
///
/// This is used in the MySQL database, the HTTP API, and throughout
/// ArtCraft (the Tauri app).
///
/// Stored in the `prompts` table (`maybe_model_type` column).
/// Also used by other tables and the sqlite tasks table.
///
/// NB: This will be used by a variety of tables (MySQL and sqlite)!
/// Keep the max length to 24 characters.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, PartialEq, Eq, Hash, Ord, PartialOrd, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum CommonModelType {
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

impl_enum_display_and_debug_using_to_str!(CommonModelType);
impl_mysql_enum_coders!(CommonModelType);
impl_mysql_from_row!(CommonModelType);

// NB: We can derive `sqlx::Type` instead of using `impl_mysql_enum_coders`

impl CommonModelType {
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

  /// Returns the broad model class for this model type.
  pub fn get_model_class(&self) -> CommonModelClass {
    match self {
      // Image models
      Self::Flux1Dev => CommonModelClass::Image,
      Self::Flux1Schnell => CommonModelClass::Image,
      Self::FluxDevJuggernaut => CommonModelClass::Image,
      Self::FluxPro1 => CommonModelClass::Image,
      Self::FluxPro11 => CommonModelClass::Image,
      Self::FluxPro11Ultra => CommonModelClass::Image,
      Self::FluxProKontextMax => CommonModelClass::Image,
      Self::Flux2LoraAngles => CommonModelClass::Image,
      Self::GptImage1 => CommonModelClass::Image,
      Self::GptImage1p5 => CommonModelClass::Image,
      Self::GrokImage => CommonModelClass::Image,
      Self::Recraft3 => CommonModelClass::Image,
      Self::SeedEdit3 => CommonModelClass::Image,
      Self::Qwen => CommonModelClass::Image,
      Self::QwenEdit2511Angles => CommonModelClass::Image,
      Self::Gemini25Flash => CommonModelClass::Image,
      Self::NanoBanana => CommonModelClass::Image,
      Self::NanoBanana2 => CommonModelClass::Image,
      Self::NanoBananaPro => CommonModelClass::Image,
      Self::Seedream4 => CommonModelClass::Image,
      Self::Seedream4p5 => CommonModelClass::Image,
      Self::Seedream5Lite => CommonModelClass::Image,
      Self::Midjourney => CommonModelClass::Image,
      Self::MidjourneyV6 => CommonModelClass::Image,
      Self::MidjourneyV6p1 => CommonModelClass::Image,
      Self::MidjourneyV6p1Raw => CommonModelClass::Image,
      Self::MidjourneyV7 => CommonModelClass::Image,
      Self::MidjourneyV7Draft => CommonModelClass::Image,
      Self::MidjourneyV7DraftRaw => CommonModelClass::Image,
      Self::MidjourneyV7Raw => CommonModelClass::Image,

      // Video models
      Self::GrokVideo => CommonModelClass::Video,
      Self::Kling16Pro => CommonModelClass::Video,
      Self::Kling21Pro => CommonModelClass::Video,
      Self::Kling21Master => CommonModelClass::Video,
      Self::Kling2p5TurboPro => CommonModelClass::Video,
      Self::Kling2p6Pro => CommonModelClass::Video,
      Self::Kling3p0Standard => CommonModelClass::Video,
      Self::Kling3p0Pro => CommonModelClass::Video,
      Self::Seedance10Lite => CommonModelClass::Video,
      Self::Seedance10Pro => CommonModelClass::Video,
      Self::Seedance1p5Pro => CommonModelClass::Video,
      Self::Seedance2p0 => CommonModelClass::Video,
      Self::Sora2 => CommonModelClass::Video,
      Self::Sora2Pro => CommonModelClass::Video,
      Self::Veo2 => CommonModelClass::Video,
      Self::Veo3 => CommonModelClass::Video,
      Self::Veo3Fast => CommonModelClass::Video,
      Self::Veo3p1 => CommonModelClass::Video,
      Self::Veo3p1Fast => CommonModelClass::Video,

      // 3D Object generation models (mesh)
      Self::Hunyuan3d2_0 => CommonModelClass::DimensionalMesh,
      Self::Hunyuan3d2_1 => CommonModelClass::DimensionalMesh,
      Self::Hunyuan3d3 => CommonModelClass::DimensionalMesh,

      // Splat generation models (World Labs)
      Self::Marble0p1Mini => CommonModelClass::DimensionalSplat,
      Self::Marble0p1Plus => CommonModelClass::DimensionalSplat,
    }
  }
}

#[cfg(test)]
mod tests {
  use crate::common::generation::common_model_class::CommonModelClass;
  use crate::common::generation::common_model_type::CommonModelType;
  use crate::common::generation::common_model_type::MAX_LENGTH;
  use crate::test_helpers::assert_serialization;

  mod explicit_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      // Image models
      assert_serialization(CommonModelType::Flux1Dev, "flux_1_dev");
      assert_serialization(CommonModelType::Flux1Schnell, "flux_1_schnell");
      assert_serialization(CommonModelType::FluxDevJuggernaut, "flux_dev_juggernaut");
      assert_serialization(CommonModelType::FluxPro1, "flux_pro_1");
      assert_serialization(CommonModelType::FluxPro11, "flux_pro_1p1");
      assert_serialization(CommonModelType::FluxPro11Ultra, "flux_pro_1p1_ultra");
      assert_serialization(CommonModelType::FluxProKontextMax, "flux_pro_kontext_max");
      assert_serialization(CommonModelType::Flux2LoraAngles, "flux_2_lora_angles");
      assert_serialization(CommonModelType::GptImage1, "gpt_image_1");
      assert_serialization(CommonModelType::GptImage1p5, "gpt_image_1p5");
      assert_serialization(CommonModelType::GrokImage, "grok_image");
      assert_serialization(CommonModelType::Recraft3, "recraft_3");
      assert_serialization(CommonModelType::SeedEdit3, "seededit_3");
      assert_serialization(CommonModelType::Qwen, "qwen");
      assert_serialization(CommonModelType::QwenEdit2511Angles, "qwen_edit_2511_angles");
      assert_serialization(CommonModelType::Gemini25Flash, "gemini_25_flash");
      assert_serialization(CommonModelType::NanoBanana, "nano_banana");
      assert_serialization(CommonModelType::NanoBanana2, "nano_banana_2");
      assert_serialization(CommonModelType::NanoBananaPro, "nano_banana_pro");
      assert_serialization(CommonModelType::Seedream4, "seedream_4");
      assert_serialization(CommonModelType::Seedream4p5, "seedream_4p5");
      assert_serialization(CommonModelType::Seedream5Lite, "seedream_5_lite");
      assert_serialization(CommonModelType::Midjourney, "midjourney");
      assert_serialization(CommonModelType::MidjourneyV6, "midjourney_v6");
      assert_serialization(CommonModelType::MidjourneyV6p1, "midjourney_v6p1");
      assert_serialization(CommonModelType::MidjourneyV6p1Raw, "midjourney_v6p1_raw");
      assert_serialization(CommonModelType::MidjourneyV7, "midjourney_v7");
      assert_serialization(CommonModelType::MidjourneyV7Draft, "midjourney_v7_draft");
      assert_serialization(CommonModelType::MidjourneyV7DraftRaw, "midjourney_v7_draft_raw");
      assert_serialization(CommonModelType::MidjourneyV7Raw, "midjourney_v7_raw");
      // Video models
      assert_serialization(CommonModelType::GrokVideo, "grok_video");
      assert_serialization(CommonModelType::Kling16Pro, "kling_1p6_pro");
      assert_serialization(CommonModelType::Kling21Pro, "kling_2p1_pro");
      assert_serialization(CommonModelType::Kling21Master, "kling_2p1_master");
      assert_serialization(CommonModelType::Kling2p5TurboPro, "kling_2p5_turbo_pro");
      assert_serialization(CommonModelType::Kling2p6Pro, "kling_2p6_pro");
      assert_serialization(CommonModelType::Kling3p0Standard, "kling_3p0_standard");
      assert_serialization(CommonModelType::Kling3p0Pro, "kling_3p0_pro");
      assert_serialization(CommonModelType::Seedance10Lite, "seedance_1p0_lite");
      assert_serialization(CommonModelType::Seedance10Pro, "seedance_1p0_pro");
      assert_serialization(CommonModelType::Seedance1p5Pro, "seedance_1p5_pro");
      assert_serialization(CommonModelType::Seedance2p0, "seedance_2p0");
      assert_serialization(CommonModelType::Sora2, "sora_2");
      assert_serialization(CommonModelType::Sora2Pro, "sora_2_pro");
      assert_serialization(CommonModelType::Veo2, "veo_2");
      assert_serialization(CommonModelType::Veo3, "veo_3");
      assert_serialization(CommonModelType::Veo3Fast, "veo_3_fast");
      assert_serialization(CommonModelType::Veo3p1, "veo_3p1");
      assert_serialization(CommonModelType::Veo3p1Fast, "veo_3p1_fast");
      // 3D Object generation models
      assert_serialization(CommonModelType::Hunyuan3d2_0, "hunyuan_3d_2p0");
      assert_serialization(CommonModelType::Hunyuan3d2_1, "hunyuan_3d_2p1");
      assert_serialization(CommonModelType::Hunyuan3d3, "hunyuan_3d_3");
      // Splat generation models (World Labs)
      assert_serialization(CommonModelType::Marble0p1Mini, "marble_0p1_mini");
      assert_serialization(CommonModelType::Marble0p1Plus, "marble_0p1_plus");
    }

    #[test]
    fn to_str() {
      // Image models
      assert_eq!(CommonModelType::Flux1Dev.to_str(), "flux_1_dev");
      assert_eq!(CommonModelType::Flux1Schnell.to_str(), "flux_1_schnell");
      assert_eq!(CommonModelType::FluxDevJuggernaut.to_str(), "flux_dev_juggernaut");
      assert_eq!(CommonModelType::FluxPro1.to_str(), "flux_pro_1");
      assert_eq!(CommonModelType::FluxPro11.to_str(), "flux_pro_1p1");
      assert_eq!(CommonModelType::FluxPro11Ultra.to_str(), "flux_pro_1p1_ultra");
      assert_eq!(CommonModelType::FluxProKontextMax.to_str(), "flux_pro_kontext_max");
      assert_eq!(CommonModelType::Flux2LoraAngles.to_str(), "flux_2_lora_angles");
      assert_eq!(CommonModelType::GptImage1.to_str(), "gpt_image_1");
      assert_eq!(CommonModelType::GptImage1p5.to_str(), "gpt_image_1p5");
      assert_eq!(CommonModelType::GrokImage.to_str(), "grok_image");
      assert_eq!(CommonModelType::Recraft3.to_str(), "recraft_3");
      assert_eq!(CommonModelType::SeedEdit3.to_str(), "seededit_3");
      assert_eq!(CommonModelType::Qwen.to_str(), "qwen");
      assert_eq!(CommonModelType::QwenEdit2511Angles.to_str(), "qwen_edit_2511_angles");
      assert_eq!(CommonModelType::Gemini25Flash.to_str(), "gemini_25_flash");
      assert_eq!(CommonModelType::NanoBanana.to_str(), "nano_banana");
      assert_eq!(CommonModelType::NanoBanana2.to_str(), "nano_banana_2");
      assert_eq!(CommonModelType::NanoBananaPro.to_str(), "nano_banana_pro");
      assert_eq!(CommonModelType::Seedream4.to_str(), "seedream_4");
      assert_eq!(CommonModelType::Seedream4p5.to_str(), "seedream_4p5");
      assert_eq!(CommonModelType::Seedream5Lite.to_str(), "seedream_5_lite");
      assert_eq!(CommonModelType::Midjourney.to_str(), "midjourney");
      assert_eq!(CommonModelType::MidjourneyV6.to_str(), "midjourney_v6");
      assert_eq!(CommonModelType::MidjourneyV6p1.to_str(), "midjourney_v6p1");
      assert_eq!(CommonModelType::MidjourneyV6p1Raw.to_str(), "midjourney_v6p1_raw");
      assert_eq!(CommonModelType::MidjourneyV7.to_str(), "midjourney_v7");
      assert_eq!(CommonModelType::MidjourneyV7Draft.to_str(), "midjourney_v7_draft");
      assert_eq!(CommonModelType::MidjourneyV7DraftRaw.to_str(), "midjourney_v7_draft_raw");
      assert_eq!(CommonModelType::MidjourneyV7Raw.to_str(), "midjourney_v7_raw");

      // Video models
      assert_eq!(CommonModelType::GrokVideo.to_str(), "grok_video");
      assert_eq!(CommonModelType::Kling16Pro.to_str(), "kling_1p6_pro");
      assert_eq!(CommonModelType::Kling21Pro.to_str(), "kling_2p1_pro");
      assert_eq!(CommonModelType::Kling21Master.to_str(), "kling_2p1_master");
      assert_eq!(CommonModelType::Kling2p5TurboPro.to_str(), "kling_2p5_turbo_pro");
      assert_eq!(CommonModelType::Kling2p6Pro.to_str(), "kling_2p6_pro");
      assert_eq!(CommonModelType::Kling3p0Standard.to_str(), "kling_3p0_standard");
      assert_eq!(CommonModelType::Kling3p0Pro.to_str(), "kling_3p0_pro");
      assert_eq!(CommonModelType::Seedance10Lite.to_str(), "seedance_1p0_lite");
      assert_eq!(CommonModelType::Seedance10Pro.to_str(), "seedance_1p0_pro");
      assert_eq!(CommonModelType::Seedance1p5Pro.to_str(), "seedance_1p5_pro");
      assert_eq!(CommonModelType::Seedance2p0.to_str(), "seedance_2p0");
      assert_eq!(CommonModelType::Sora2.to_str(), "sora_2");
      assert_eq!(CommonModelType::Sora2Pro.to_str(), "sora_2_pro");
      assert_eq!(CommonModelType::Veo2.to_str(), "veo_2");
      assert_eq!(CommonModelType::Veo3.to_str(), "veo_3");
      assert_eq!(CommonModelType::Veo3Fast.to_str(), "veo_3_fast");
      assert_eq!(CommonModelType::Veo3p1.to_str(), "veo_3p1");
      assert_eq!(CommonModelType::Veo3p1Fast.to_str(), "veo_3p1_fast");

      // 3D Object generation models
      assert_eq!(CommonModelType::Hunyuan3d2_0.to_str(), "hunyuan_3d_2p0");
      assert_eq!(CommonModelType::Hunyuan3d2_1.to_str(), "hunyuan_3d_2p1");
      assert_eq!(CommonModelType::Hunyuan3d3.to_str(), "hunyuan_3d_3");
      // Splat generation models (World Labs)
      assert_eq!(CommonModelType::Marble0p1Mini.to_str(), "marble_0p1_mini");
      assert_eq!(CommonModelType::Marble0p1Plus.to_str(), "marble_0p1_plus");
    }

    #[test]
    fn from_str() {
      // Image models
      assert_eq!(CommonModelType::from_str("flux_1_dev").unwrap(), CommonModelType::Flux1Dev);
      assert_eq!(CommonModelType::from_str("flux_1_schnell").unwrap(), CommonModelType::Flux1Schnell);
      assert_eq!(CommonModelType::from_str("flux_dev_juggernaut").unwrap(), CommonModelType::FluxDevJuggernaut);
      assert_eq!(CommonModelType::from_str("flux_pro_1").unwrap(), CommonModelType::FluxPro1);
      assert_eq!(CommonModelType::from_str("flux_pro_1p1").unwrap(), CommonModelType::FluxPro11);
      assert_eq!(CommonModelType::from_str("flux_pro_1p1_ultra").unwrap(), CommonModelType::FluxPro11Ultra);
      assert_eq!(CommonModelType::from_str("flux_pro_kontext_max").unwrap(), CommonModelType::FluxProKontextMax);
      assert_eq!(CommonModelType::from_str("flux_2_lora_angles").unwrap(), CommonModelType::Flux2LoraAngles);
      assert_eq!(CommonModelType::from_str("gpt_image_1").unwrap(), CommonModelType::GptImage1);
      assert_eq!(CommonModelType::from_str("gpt_image_1p5").unwrap(), CommonModelType::GptImage1p5);
      assert_eq!(CommonModelType::from_str("grok_image").unwrap(), CommonModelType::GrokImage);
      assert_eq!(CommonModelType::from_str("recraft_3").unwrap(), CommonModelType::Recraft3);
      assert_eq!(CommonModelType::from_str("seededit_3").unwrap(), CommonModelType::SeedEdit3);
      assert_eq!(CommonModelType::from_str("qwen").unwrap(), CommonModelType::Qwen);
      assert_eq!(CommonModelType::from_str("qwen_edit_2511_angles").unwrap(), CommonModelType::QwenEdit2511Angles);
      assert_eq!(CommonModelType::from_str("gemini_25_flash").unwrap(), CommonModelType::Gemini25Flash);
      assert_eq!(CommonModelType::from_str("nano_banana").unwrap(), CommonModelType::NanoBanana);
      assert_eq!(CommonModelType::from_str("nano_banana_2").unwrap(), CommonModelType::NanoBanana2);
      assert_eq!(CommonModelType::from_str("nano_banana_pro").unwrap(), CommonModelType::NanoBananaPro);
      assert_eq!(CommonModelType::from_str("seedream_4").unwrap(), CommonModelType::Seedream4);
      assert_eq!(CommonModelType::from_str("seedream_4p5").unwrap(), CommonModelType::Seedream4p5);
      assert_eq!(CommonModelType::from_str("seedream_5_lite").unwrap(), CommonModelType::Seedream5Lite);
      assert_eq!(CommonModelType::from_str("midjourney").unwrap(), CommonModelType::Midjourney);
      assert_eq!(CommonModelType::from_str("midjourney_v6").unwrap(), CommonModelType::MidjourneyV6);
      assert_eq!(CommonModelType::from_str("midjourney_v6p1").unwrap(), CommonModelType::MidjourneyV6p1);
      assert_eq!(CommonModelType::from_str("midjourney_v6p1_raw").unwrap(), CommonModelType::MidjourneyV6p1Raw);
      assert_eq!(CommonModelType::from_str("midjourney_v7").unwrap(), CommonModelType::MidjourneyV7);
      assert_eq!(CommonModelType::from_str("midjourney_v7_draft").unwrap(), CommonModelType::MidjourneyV7Draft);
      assert_eq!(CommonModelType::from_str("midjourney_v7_draft_raw").unwrap(), CommonModelType::MidjourneyV7DraftRaw);
      assert_eq!(CommonModelType::from_str("midjourney_v7_raw").unwrap(), CommonModelType::MidjourneyV7Raw);
      // Video models
      assert_eq!(CommonModelType::from_str("grok_video").unwrap(), CommonModelType::GrokVideo);
      assert_eq!(CommonModelType::from_str("kling_1p6_pro").unwrap(), CommonModelType::Kling16Pro);
      assert_eq!(CommonModelType::from_str("kling_2p1_pro").unwrap(), CommonModelType::Kling21Pro);
      assert_eq!(CommonModelType::from_str("kling_2p1_master").unwrap(), CommonModelType::Kling21Master);
      assert_eq!(CommonModelType::from_str("kling_2p5_turbo_pro").unwrap(), CommonModelType::Kling2p5TurboPro);
      assert_eq!(CommonModelType::from_str("kling_2p6_pro").unwrap(), CommonModelType::Kling2p6Pro);
      assert_eq!(CommonModelType::from_str("kling_3p0_standard").unwrap(), CommonModelType::Kling3p0Standard);
      assert_eq!(CommonModelType::from_str("kling_3p0_pro").unwrap(), CommonModelType::Kling3p0Pro);
      assert_eq!(CommonModelType::from_str("seedance_1p0_lite").unwrap(), CommonModelType::Seedance10Lite);
      assert_eq!(CommonModelType::from_str("seedance_1p0_pro").unwrap(), CommonModelType::Seedance10Pro);
      assert_eq!(CommonModelType::from_str("seedance_1p5_pro").unwrap(), CommonModelType::Seedance1p5Pro);
      assert_eq!(CommonModelType::from_str("seedance_2p0").unwrap(), CommonModelType::Seedance2p0);
      assert_eq!(CommonModelType::from_str("sora_2").unwrap(), CommonModelType::Sora2);
      assert_eq!(CommonModelType::from_str("sora_2_pro").unwrap(), CommonModelType::Sora2Pro);
      assert_eq!(CommonModelType::from_str("veo_2").unwrap(), CommonModelType::Veo2);
      assert_eq!(CommonModelType::from_str("veo_3").unwrap(), CommonModelType::Veo3);
      assert_eq!(CommonModelType::from_str("veo_3_fast").unwrap(), CommonModelType::Veo3Fast);
      assert_eq!(CommonModelType::from_str("veo_3p1").unwrap(), CommonModelType::Veo3p1);
      assert_eq!(CommonModelType::from_str("veo_3p1_fast").unwrap(), CommonModelType::Veo3p1Fast);
      
      // 3D Object generation models
      assert_eq!(CommonModelType::from_str("hunyuan_3d_2p0").unwrap(), CommonModelType::Hunyuan3d2_0);
      assert_eq!(CommonModelType::from_str("hunyuan_3d_2p1").unwrap(), CommonModelType::Hunyuan3d2_1);
      assert_eq!(CommonModelType::from_str("hunyuan_3d_3").unwrap(), CommonModelType::Hunyuan3d3);
      // Splat generation models (World Labs)
      assert_eq!(CommonModelType::from_str("marble_0p1_mini").unwrap(), CommonModelType::Marble0p1Mini);
      assert_eq!(CommonModelType::from_str("marble_0p1_plus").unwrap(), CommonModelType::Marble0p1Plus);
    }

    #[test]
    fn all_variants() {
      let mut variants = CommonModelType::all_variants();
      assert_eq!(variants.len(), 54);
      // Image models
      assert_eq!(variants.pop_first(), Some(CommonModelType::Flux1Dev));
      assert_eq!(variants.pop_first(), Some(CommonModelType::Flux1Schnell));
      assert_eq!(variants.pop_first(), Some(CommonModelType::FluxDevJuggernaut));
      assert_eq!(variants.pop_first(), Some(CommonModelType::FluxPro1));
      assert_eq!(variants.pop_first(), Some(CommonModelType::FluxPro11));
      assert_eq!(variants.pop_first(), Some(CommonModelType::FluxPro11Ultra));
      assert_eq!(variants.pop_first(), Some(CommonModelType::FluxProKontextMax));
      assert_eq!(variants.pop_first(), Some(CommonModelType::Flux2LoraAngles));
      assert_eq!(variants.pop_first(), Some(CommonModelType::GptImage1));
      assert_eq!(variants.pop_first(), Some(CommonModelType::GptImage1p5));
      assert_eq!(variants.pop_first(), Some(CommonModelType::GrokImage));
      assert_eq!(variants.pop_first(), Some(CommonModelType::Recraft3));
      assert_eq!(variants.pop_first(), Some(CommonModelType::SeedEdit3));
      assert_eq!(variants.pop_first(), Some(CommonModelType::Qwen));
      assert_eq!(variants.pop_first(), Some(CommonModelType::QwenEdit2511Angles));
      assert_eq!(variants.pop_first(), Some(CommonModelType::Gemini25Flash));
      assert_eq!(variants.pop_first(), Some(CommonModelType::NanoBanana));
      assert_eq!(variants.pop_first(), Some(CommonModelType::NanoBanana2));
      assert_eq!(variants.pop_first(), Some(CommonModelType::NanoBananaPro));
      assert_eq!(variants.pop_first(), Some(CommonModelType::Seedream4));
      assert_eq!(variants.pop_first(), Some(CommonModelType::Seedream4p5));
      assert_eq!(variants.pop_first(), Some(CommonModelType::Seedream5Lite));
      assert_eq!(variants.pop_first(), Some(CommonModelType::Midjourney));
      assert_eq!(variants.pop_first(), Some(CommonModelType::MidjourneyV6));
      assert_eq!(variants.pop_first(), Some(CommonModelType::MidjourneyV6p1));
      assert_eq!(variants.pop_first(), Some(CommonModelType::MidjourneyV6p1Raw));
      assert_eq!(variants.pop_first(), Some(CommonModelType::MidjourneyV7));
      assert_eq!(variants.pop_first(), Some(CommonModelType::MidjourneyV7Draft));
      assert_eq!(variants.pop_first(), Some(CommonModelType::MidjourneyV7DraftRaw));
      assert_eq!(variants.pop_first(), Some(CommonModelType::MidjourneyV7Raw));
      // Video models
      assert_eq!(variants.pop_first(), Some(CommonModelType::GrokVideo));
      assert_eq!(variants.pop_first(), Some(CommonModelType::Kling16Pro));
      assert_eq!(variants.pop_first(), Some(CommonModelType::Kling21Pro));
      assert_eq!(variants.pop_first(), Some(CommonModelType::Kling21Master));
      assert_eq!(variants.pop_first(), Some(CommonModelType::Kling2p5TurboPro));
      assert_eq!(variants.pop_first(), Some(CommonModelType::Kling2p6Pro));
      assert_eq!(variants.pop_first(), Some(CommonModelType::Kling3p0Standard));
      assert_eq!(variants.pop_first(), Some(CommonModelType::Kling3p0Pro));
      assert_eq!(variants.pop_first(), Some(CommonModelType::Seedance10Lite));
      assert_eq!(variants.pop_first(), Some(CommonModelType::Seedance10Pro));
      assert_eq!(variants.pop_first(), Some(CommonModelType::Seedance1p5Pro));
      assert_eq!(variants.pop_first(), Some(CommonModelType::Seedance2p0));
      assert_eq!(variants.pop_first(), Some(CommonModelType::Sora2));
      assert_eq!(variants.pop_first(), Some(CommonModelType::Sora2Pro));
      assert_eq!(variants.pop_first(), Some(CommonModelType::Veo2));
      assert_eq!(variants.pop_first(), Some(CommonModelType::Veo3));
      assert_eq!(variants.pop_first(), Some(CommonModelType::Veo3Fast));
      assert_eq!(variants.pop_first(), Some(CommonModelType::Veo3p1));
      assert_eq!(variants.pop_first(), Some(CommonModelType::Veo3p1Fast));
      // 3D Object generation models
      assert_eq!(variants.pop_first(), Some(CommonModelType::Hunyuan3d2_0));
      assert_eq!(variants.pop_first(), Some(CommonModelType::Hunyuan3d2_1));
      assert_eq!(variants.pop_first(), Some(CommonModelType::Hunyuan3d3));
      // Splat generation models (World Labs)
      assert_eq!(variants.pop_first(), Some(CommonModelType::Marble0p1Mini));
      assert_eq!(variants.pop_first(), Some(CommonModelType::Marble0p1Plus));

      assert_eq!(variants.pop_first(), None);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn variant_length() {
      use strum::IntoEnumIterator;
      assert_eq!(CommonModelType::all_variants().len(), CommonModelType::iter().len());
    }

    #[test]
    fn round_trip() {
      for variant in CommonModelType::all_variants() {
        // Test to_str(), from_str(), Display, and Debug.
        assert_eq!(variant, CommonModelType::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, CommonModelType::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, CommonModelType::from_str(&format!("{:?}", variant)).unwrap());
      }
    }

    #[test]
    fn serialized_length_ok_for_database() {
      for variant in CommonModelType::all_variants() {
        let serialized = variant.to_str();
        assert!(serialized.len() > 0, "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long", variant);
      }
    }

    #[test]
    fn serialized_names_must_not_contain_dots() {
      for variant in CommonModelType::all_variants() {
        let to_str_value = variant.to_str();
        assert!(!to_str_value.contains('.'), "to_str() for {:?} contains a dot: {:?}", variant, to_str_value);

        let json_value = serde_json::to_string(&variant).unwrap().replace('"', "");
        assert!(!json_value.contains('.'), "JSON serialization for {:?} contains a dot: {:?}", variant, json_value);
      }
    }

    #[test]
    fn serialized_names_must_only_contain_lowercase_alphanumeric_and_underscore() {
      let valid_pattern = regex::Regex::new(r"^[a-z0-9_]+$").unwrap();

      for variant in CommonModelType::all_variants() {
        let to_str_value = variant.to_str();
        assert!(valid_pattern.is_match(to_str_value),
          "to_str() for {:?} contains invalid characters: {:?} (only a-z, 0-9, _ allowed)", variant, to_str_value);

        let json_value = serde_json::to_string(&variant).unwrap().replace('"', "");
        assert!(valid_pattern.is_match(&json_value),
          "JSON serialization for {:?} contains invalid characters: {:?} (only a-z, 0-9, _ allowed)", variant, json_value);
      }
    }

    #[test]
    fn every_variant_has_a_model_class() {
      for variant in CommonModelType::all_variants() {
        let class = variant.get_model_class();
        // Verify the class is a known value (not panicking is the main test)
        assert!(CommonModelClass::all_variants().contains(&class),
          "get_model_class() for {:?} returned {:?} which is not a known CommonModelClass variant", variant, class);
      }
    }

    #[test]
    fn image_models_return_image_class() {
      assert_eq!(CommonModelType::Flux1Dev.get_model_class(), CommonModelClass::Image);
      assert_eq!(CommonModelType::GptImage1.get_model_class(), CommonModelClass::Image);
      assert_eq!(CommonModelType::Midjourney.get_model_class(), CommonModelClass::Image);
    }

    #[test]
    fn video_models_return_video_class() {
      assert_eq!(CommonModelType::Veo3.get_model_class(), CommonModelClass::Video);
      assert_eq!(CommonModelType::Sora2.get_model_class(), CommonModelClass::Video);
      assert_eq!(CommonModelType::Kling3p0Pro.get_model_class(), CommonModelClass::Video);
    }

    #[test]
    fn dimensional_models_return_correct_class() {
      assert_eq!(CommonModelType::Hunyuan3d2_0.get_model_class(), CommonModelClass::DimensionalMesh);
      assert_eq!(CommonModelType::Hunyuan3d3.get_model_class(), CommonModelClass::DimensionalMesh);
      assert_eq!(CommonModelType::Marble0p1Mini.get_model_class(), CommonModelClass::DimensionalSplat);
      assert_eq!(CommonModelType::Marble0p1Plus.get_model_class(), CommonModelClass::DimensionalSplat);
    }
  }
}
