use std::collections::BTreeSet;

use crate::error::enum_error::EnumError;
#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;
use utoipa::ToSchema;

#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, PartialEq, Eq, Hash, Ord, PartialOrd, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum TaskModelType {
  // Image models
  #[serde(rename = "flux_1_dev")]
  Flux1Dev,
  #[serde(rename = "flux_1_schnell")]
  Flux1Schnell,
  #[serde(rename = "flux_dev_juggernaut")]
  FluxDevJuggernaut,
  // NB: For inpainting for now
  #[serde(rename = "flux_pro_1")]
  FluxPro1,
  #[serde(rename = "flux_pro_1.1")]
  FluxPro11,
  #[serde(rename = "flux_pro_1.1_ultra")]
  FluxPro11Ultra,
  #[serde(rename = "flux_pro_kontext_max")]
  FluxProKontextMax,
  #[serde(rename = "gemini_25_flash")]
  Gemini25Flash,
  #[serde(rename = "nano_banana")]
  NanoBanana,
  #[serde(rename = "nano_banana_2")]
  NanoBanana2,
  #[serde(rename = "nano_banana_pro")]
  NanoBananaPro,
  #[serde(rename = "gpt_image_1")]
  GptImage1,
  #[serde(rename = "gpt_image_1p5")]
  GptImage1p5,
  #[serde(rename = "seedream_4")]
  Seedream4,
  #[serde(rename = "seedream_4p5")]
  Seedream4p5,
  #[serde(rename = "seedream_5_lite")]
  Seedream5Lite,
  #[serde(rename = "grok_image")]
  GrokImage,
  #[serde(rename = "recraft_3")]
  Recraft3,
  
  // Generic Midjourney model, version unknown.
  #[serde(rename = "midjourney")]
  Midjourney,

  // Video models
  #[serde(rename = "grok_video")]
  GrokVideo, // Video version unspecified/unknown
  #[serde(rename = "kling_1.6_pro")]
  Kling16Pro,
  #[serde(rename = "kling_2.1_pro")]
  Kling21Pro,
  #[serde(rename = "kling_2.1_master")]
  Kling21Master,
  #[serde(rename = "kling_2p5_turbo_pro")]
  Kling2p5TurboPro,
  #[serde(rename = "kling_2p6_pro")]
  Kling2p6Pro,
  #[serde(rename = "seedance_1.0_lite")]
  Seedance10Lite,
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
  #[serde(rename = "hunyuan_3d_2.0")]
  Hunyuan3d2_0,
  #[serde(rename = "hunyuan_3d_2.1")]
  Hunyuan3d2_1,
  #[serde(rename = "hunyuan_3d_3")]
  Hunyuan3d3,
  #[serde(rename = "worldlabs_marble")]
  WorldlabsMarble,
}

impl_enum_display_and_debug_using_to_str!(TaskModelType);
//impl_mysql_enum_coders!(TaskModelType);
//impl_mysql_from_row!(TaskModelType);

// NB: We can derive `sqlx::Type` instead of using `impl_mysql_enum_coders`

impl TaskModelType {
  pub fn to_str(&self) -> &'static str {
    match self {
      // Image models
      Self::Flux1Dev => "flux_1_dev",
      Self::Flux1Schnell => "flux_1_schnell",
      Self::FluxDevJuggernaut => "flux_dev_juggernaut",
      Self::FluxPro1 => "flux_pro_1",
      Self::FluxPro11 => "flux_pro_1.1",
      Self::FluxPro11Ultra => "flux_pro_1.1_ultra",
      Self::FluxProKontextMax => "flux_pro_kontext_max",
      Self::Gemini25Flash => "gemini_25_flash",
      Self::NanoBanana => "nano_banana",
      Self::NanoBanana2 => "nano_banana_2",
      Self::NanoBananaPro => "nano_banana_pro",
      Self::GptImage1 => "gpt_image_1",
      Self::GptImage1p5 => "gpt_image_1p5",
      Self::Seedream4 => "seedream_4",
      Self::Seedream4p5 => "seedream_4p5",
      Self::Seedream5Lite => "seedream_5_lite",
      Self::GrokImage => "grok_image",
      Self::Recraft3 => "recraft_3",
      Self::Midjourney => "midjourney",
      // Video models
      Self::GrokVideo => "grok_video",
      Self::Kling16Pro => "kling_1.6_pro",
      Self::Kling21Pro => "kling_2.1_pro",
      Self::Kling21Master => "kling_2.1_master",
      Self::Kling2p5TurboPro => "kling_2p5_turbo_pro",
      Self::Kling2p6Pro => "kling_2p6_pro",
      Self::Seedance10Lite => "seedance_1.0_lite",
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
      Self::Hunyuan3d2_0 => "hunyuan_3d_2.0",
      Self::Hunyuan3d2_1 => "hunyuan_3d_2.1",
      Self::Hunyuan3d3 => "hunyuan_3d_3",
      Self::WorldlabsMarble => "worldlabs_marble",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, EnumError> {
    match value {
      // Image models
      "flux_1_dev" => Ok(Self::Flux1Dev),
      "flux_1_schnell" => Ok(Self::Flux1Schnell),
      "flux_dev_juggernaut" => Ok(Self::FluxDevJuggernaut),
      "flux_pro_1" => Ok(Self::FluxPro1),
      "flux_pro_1.1" => Ok(Self::FluxPro11),
      "flux_pro_1.1_ultra" => Ok(Self::FluxPro11Ultra),
      "flux_pro_kontext_max" => Ok(Self::FluxProKontextMax),
      "gemini_25_flash" => Ok(Self::Gemini25Flash),
      "nano_banana" => Ok(Self::NanoBanana),
      "nano_banana_2" => Ok(Self::NanoBanana2),
      "nano_banana_pro" => Ok(Self::NanoBananaPro),
      "gpt_image_1" => Ok(Self::GptImage1),
      "gpt_image_1p5" => Ok(Self::GptImage1p5),
      "seedream_4" => Ok(Self::Seedream4),
      "seedream_4p5" => Ok(Self::Seedream4p5),
      "seedream_5_lite" => Ok(Self::Seedream5Lite),
      "grok_image" => Ok(Self::GrokImage),
      "recraft_3" => Ok(Self::Recraft3),
      "midjourney" => Ok(Self::Midjourney),
      // Video models
      "grok_video" => Ok(Self::GrokVideo),
      "kling_1.6_pro" => Ok(Self::Kling16Pro),
      "kling_2.1_pro" => Ok(Self::Kling21Pro),
      "kling_2.1_master" => Ok(Self::Kling21Master),
      "kling_2p5_turbo_pro" => Ok(Self::Kling2p5TurboPro),
      "kling_2p6_pro" => Ok(Self::Kling2p6Pro),
      "seedance_1.0_lite" => Ok(Self::Seedance10Lite),
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
      "hunyuan_3d_2.0" => Ok(Self::Hunyuan3d2_0),
      "hunyuan_3d_2.1" => Ok(Self::Hunyuan3d2_1),
      "hunyuan_3d_3" => Ok(Self::Hunyuan3d3),
      "worldlabs_marble" => Ok(Self::WorldlabsMarble),
      _ => Err(EnumError::CouldNotConvertFromString(value.to_string())),
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
      Self::Gemini25Flash,
      Self::NanoBanana,
      Self::NanoBanana2,
      Self::NanoBananaPro,
      Self::GptImage1,
      Self::GptImage1p5,
      Self::Seedream4,
      Self::Seedream4p5,
      Self::Seedream5Lite,
      Self::GrokImage,
      Self::Recraft3,
      Self::Midjourney,
      // Video models
      Self::GrokVideo,
      Self::Kling16Pro,
      Self::Kling21Pro,
      Self::Kling21Master,
      Self::Kling2p5TurboPro,
      Self::Kling2p6Pro,
      Self::Seedance10Lite,
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
      Self::WorldlabsMarble,
    ])
  }
}

#[cfg(test)]
mod tests {
  use crate::tauri::tasks::task_model_type::TaskModelType;
  use crate::test_helpers::assert_serialization;
  use crate::error::enum_error::EnumError;

  mod explicit_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      // Image models
      assert_serialization(TaskModelType::Flux1Dev, "flux_1_dev");
      assert_serialization(TaskModelType::Flux1Schnell, "flux_1_schnell");
      assert_serialization(TaskModelType::FluxDevJuggernaut, "flux_dev_juggernaut");
      assert_serialization(TaskModelType::FluxPro1, "flux_pro_1");
      assert_serialization(TaskModelType::FluxPro11, "flux_pro_1.1");
      assert_serialization(TaskModelType::FluxPro11Ultra, "flux_pro_1.1_ultra");
      assert_serialization(TaskModelType::FluxProKontextMax, "flux_pro_kontext_max");
      assert_serialization(TaskModelType::Gemini25Flash, "gemini_25_flash");
      assert_serialization(TaskModelType::NanoBanana, "nano_banana");
      assert_serialization(TaskModelType::NanoBanana2, "nano_banana_2");
      assert_serialization(TaskModelType::NanoBananaPro, "nano_banana_pro");
      assert_serialization(TaskModelType::GptImage1, "gpt_image_1");
      assert_serialization(TaskModelType::GptImage1p5, "gpt_image_1p5");
      assert_serialization(TaskModelType::Seedream4, "seedream_4");
      assert_serialization(TaskModelType::Seedream4p5, "seedream_4p5");
      assert_serialization(TaskModelType::Seedream5Lite, "seedream_5_lite");
      assert_serialization(TaskModelType::GrokImage, "grok_image");
      assert_serialization(TaskModelType::Recraft3, "recraft_3");
      assert_serialization(TaskModelType::Midjourney, "midjourney");
      // Video models
      assert_serialization(TaskModelType::GrokVideo, "grok_video");
      assert_serialization(TaskModelType::Kling16Pro, "kling_1.6_pro");
      assert_serialization(TaskModelType::Kling21Pro, "kling_2.1_pro");
      assert_serialization(TaskModelType::Kling21Master, "kling_2.1_master");
      assert_serialization(TaskModelType::Kling2p5TurboPro, "kling_2p5_turbo_pro");
      assert_serialization(TaskModelType::Kling2p6Pro, "kling_2p6_pro");
      assert_serialization(TaskModelType::Seedance10Lite, "seedance_1.0_lite");
      assert_serialization(TaskModelType::Seedance1p5Pro, "seedance_1p5_pro");
      assert_serialization(TaskModelType::Seedance2p0, "seedance_2p0");
      assert_serialization(TaskModelType::Sora2, "sora_2");
      assert_serialization(TaskModelType::Sora2Pro, "sora_2_pro");
      assert_serialization(TaskModelType::Veo2, "veo_2");
      assert_serialization(TaskModelType::Veo3, "veo_3");
      assert_serialization(TaskModelType::Veo3Fast, "veo_3_fast");
      assert_serialization(TaskModelType::Veo3p1, "veo_3p1");
      assert_serialization(TaskModelType::Veo3p1Fast, "veo_3p1_fast");
      // 3D Object generation models
      assert_serialization(TaskModelType::Hunyuan3d2_0, "hunyuan_3d_2.0");
      assert_serialization(TaskModelType::Hunyuan3d2_1, "hunyuan_3d_2.1");
      assert_serialization(TaskModelType::Hunyuan3d3, "hunyuan_3d_3");
      assert_serialization(TaskModelType::WorldlabsMarble, "worldlabs_marble");
    }

    #[test]
    fn to_str() {
      // Image models
      assert_eq!(TaskModelType::Flux1Dev.to_str(), "flux_1_dev");
      assert_eq!(TaskModelType::Flux1Schnell.to_str(), "flux_1_schnell");
      assert_eq!(TaskModelType::FluxDevJuggernaut.to_str(), "flux_dev_juggernaut");
      assert_eq!(TaskModelType::FluxPro1.to_str(), "flux_pro_1");
      assert_eq!(TaskModelType::FluxPro11.to_str(), "flux_pro_1.1");
      assert_eq!(TaskModelType::FluxPro11Ultra.to_str(), "flux_pro_1.1_ultra");
      assert_eq!(TaskModelType::FluxProKontextMax.to_str(), "flux_pro_kontext_max");
      assert_eq!(TaskModelType::Gemini25Flash.to_str(), "gemini_25_flash");
      assert_eq!(TaskModelType::NanoBanana.to_str(), "nano_banana");
      assert_eq!(TaskModelType::NanoBanana2.to_str(), "nano_banana_2");
      assert_eq!(TaskModelType::NanoBananaPro.to_str(), "nano_banana_pro");
      assert_eq!(TaskModelType::GptImage1.to_str(), "gpt_image_1");
      assert_eq!(TaskModelType::GptImage1p5.to_str(), "gpt_image_1p5");
      assert_eq!(TaskModelType::Seedream4.to_str(), "seedream_4");
      assert_eq!(TaskModelType::Seedream4p5.to_str(), "seedream_4p5");
      assert_eq!(TaskModelType::Seedream5Lite.to_str(), "seedream_5_lite");
      assert_eq!(TaskModelType::GrokImage.to_str(), "grok_image");
      assert_eq!(TaskModelType::Recraft3.to_str(), "recraft_3");
      assert_eq!(TaskModelType::Midjourney.to_str(), "midjourney");
      // Video models
      assert_eq!(TaskModelType::GrokVideo.to_str(), "grok_video");
      assert_eq!(TaskModelType::Kling16Pro.to_str(), "kling_1.6_pro");
      assert_eq!(TaskModelType::Kling21Pro.to_str(), "kling_2.1_pro");
      assert_eq!(TaskModelType::Kling21Master.to_str(), "kling_2.1_master");
      assert_eq!(TaskModelType::Kling2p5TurboPro.to_str(), "kling_2p5_turbo_pro");
      assert_eq!(TaskModelType::Kling2p6Pro.to_str(), "kling_2p6_pro");
      assert_eq!(TaskModelType::Seedance10Lite.to_str(), "seedance_1.0_lite");
      assert_eq!(TaskModelType::Seedance1p5Pro.to_str(), "seedance_1p5_pro");
      assert_eq!(TaskModelType::Seedance2p0.to_str(), "seedance_2p0");
      assert_eq!(TaskModelType::Sora2.to_str(), "sora_2");
      assert_eq!(TaskModelType::Sora2Pro.to_str(), "sora_2_pro");
      assert_eq!(TaskModelType::Veo2.to_str(), "veo_2");
      assert_eq!(TaskModelType::Veo3.to_str(), "veo_3");
      assert_eq!(TaskModelType::Veo3Fast.to_str(), "veo_3_fast");
      assert_eq!(TaskModelType::Veo3p1.to_str(), "veo_3p1");
      assert_eq!(TaskModelType::Veo3p1Fast.to_str(), "veo_3p1_fast");
      // 3D Object generation models
      assert_eq!(TaskModelType::Hunyuan3d2_0.to_str(), "hunyuan_3d_2.0");
      assert_eq!(TaskModelType::Hunyuan3d2_1.to_str(), "hunyuan_3d_2.1");
      assert_eq!(TaskModelType::Hunyuan3d3.to_str(), "hunyuan_3d_3");
      assert_eq!(TaskModelType::WorldlabsMarble.to_str(), "worldlabs_marble");
    }

    #[test]
    fn from_str() {
      // Image models
      assert_eq!(TaskModelType::from_str("flux_1_dev").unwrap(), TaskModelType::Flux1Dev);
      assert_eq!(TaskModelType::from_str("flux_1_schnell").unwrap(), TaskModelType::Flux1Schnell);
      assert_eq!(TaskModelType::from_str("flux_dev_juggernaut").unwrap(), TaskModelType::FluxDevJuggernaut);
      assert_eq!(TaskModelType::from_str("flux_pro_1").unwrap(), TaskModelType::FluxPro1);
      assert_eq!(TaskModelType::from_str("flux_pro_1.1").unwrap(), TaskModelType::FluxPro11);
      assert_eq!(TaskModelType::from_str("flux_pro_1.1_ultra").unwrap(), TaskModelType::FluxPro11Ultra);
      assert_eq!(TaskModelType::from_str("flux_pro_kontext_max").unwrap(), TaskModelType::FluxProKontextMax);
      assert_eq!(TaskModelType::from_str("gemini_25_flash").unwrap(), TaskModelType::Gemini25Flash);
      assert_eq!(TaskModelType::from_str("nano_banana").unwrap(), TaskModelType::NanoBanana);
      assert_eq!(TaskModelType::from_str("nano_banana_2").unwrap(), TaskModelType::NanoBanana2);
      assert_eq!(TaskModelType::from_str("nano_banana_pro").unwrap(), TaskModelType::NanoBananaPro);
      assert_eq!(TaskModelType::from_str("gpt_image_1").unwrap(), TaskModelType::GptImage1);
      assert_eq!(TaskModelType::from_str("gpt_image_1p5").unwrap(), TaskModelType::GptImage1p5);
      assert_eq!(TaskModelType::from_str("seedream_4").unwrap(), TaskModelType::Seedream4);
      assert_eq!(TaskModelType::from_str("seedream_4p5").unwrap(), TaskModelType::Seedream4p5);
      assert_eq!(TaskModelType::from_str("seedream_5_lite").unwrap(), TaskModelType::Seedream5Lite);
      assert_eq!(TaskModelType::from_str("grok_image").unwrap(), TaskModelType::GrokImage);
      assert_eq!(TaskModelType::from_str("recraft_3").unwrap(), TaskModelType::Recraft3);
      assert_eq!(TaskModelType::from_str("midjourney").unwrap(), TaskModelType::Midjourney);
      // Video models
      assert_eq!(TaskModelType::from_str("grok_video").unwrap(), TaskModelType::GrokVideo);
      assert_eq!(TaskModelType::from_str("kling_1.6_pro").unwrap(), TaskModelType::Kling16Pro);
      assert_eq!(TaskModelType::from_str("kling_2.1_pro").unwrap(), TaskModelType::Kling21Pro);
      assert_eq!(TaskModelType::from_str("kling_2.1_master").unwrap(), TaskModelType::Kling21Master);
      assert_eq!(TaskModelType::from_str("kling_2p5_turbo_pro").unwrap(), TaskModelType::Kling2p5TurboPro);
      assert_eq!(TaskModelType::from_str("kling_2p6_pro").unwrap(), TaskModelType::Kling2p6Pro);
      assert_eq!(TaskModelType::from_str("seedance_1.0_lite").unwrap(), TaskModelType::Seedance10Lite);
      assert_eq!(TaskModelType::from_str("seedance_1p5_pro").unwrap(), TaskModelType::Seedance1p5Pro);
      assert_eq!(TaskModelType::from_str("seedance_2p0").unwrap(), TaskModelType::Seedance2p0);
      assert_eq!(TaskModelType::from_str("sora_2").unwrap(), TaskModelType::Sora2);
      assert_eq!(TaskModelType::from_str("sora_2_pro").unwrap(), TaskModelType::Sora2Pro);
      assert_eq!(TaskModelType::from_str("veo_2").unwrap(), TaskModelType::Veo2);
      assert_eq!(TaskModelType::from_str("veo_3").unwrap(), TaskModelType::Veo3);
      assert_eq!(TaskModelType::from_str("veo_3_fast").unwrap(), TaskModelType::Veo3Fast);
      assert_eq!(TaskModelType::from_str("veo_3p1").unwrap(), TaskModelType::Veo3p1);
      assert_eq!(TaskModelType::from_str("veo_3p1_fast").unwrap(), TaskModelType::Veo3p1Fast);
      // 3D Object generation models
      assert_eq!(TaskModelType::from_str("hunyuan_3d_2.0").unwrap(), TaskModelType::Hunyuan3d2_0);
      assert_eq!(TaskModelType::from_str("hunyuan_3d_2.1").unwrap(), TaskModelType::Hunyuan3d2_1);
      assert_eq!(TaskModelType::from_str("hunyuan_3d_3").unwrap(), TaskModelType::Hunyuan3d3);
      assert_eq!(TaskModelType::from_str("worldlabs_marble").unwrap(), TaskModelType::WorldlabsMarble);
    }

    #[test]
    fn from_str_err() {
      let result = TaskModelType::from_str("asdf");
      assert!(result.is_err());
      if let Err(EnumError::CouldNotConvertFromString(value)) = result {
        assert_eq!(value, "asdf");
      } else {
        panic!("Expected EnumError::CouldNotConvertFromString");
      }
    }

    #[test]
    fn all_variants() {
      let mut variants = TaskModelType::all_variants();
      assert_eq!(variants.len(), 39);
      // Image models
      assert_eq!(variants.pop_first(), Some(TaskModelType::Flux1Dev));
      assert_eq!(variants.pop_first(), Some(TaskModelType::Flux1Schnell));
      assert_eq!(variants.pop_first(), Some(TaskModelType::FluxDevJuggernaut));
      assert_eq!(variants.pop_first(), Some(TaskModelType::FluxPro1));
      assert_eq!(variants.pop_first(), Some(TaskModelType::FluxPro11));
      assert_eq!(variants.pop_first(), Some(TaskModelType::FluxPro11Ultra));
      assert_eq!(variants.pop_first(), Some(TaskModelType::FluxProKontextMax));
      assert_eq!(variants.pop_first(), Some(TaskModelType::Gemini25Flash));
      assert_eq!(variants.pop_first(), Some(TaskModelType::NanoBanana));
      assert_eq!(variants.pop_first(), Some(TaskModelType::NanoBanana2));
      assert_eq!(variants.pop_first(), Some(TaskModelType::NanoBananaPro));
      assert_eq!(variants.pop_first(), Some(TaskModelType::GptImage1));
      assert_eq!(variants.pop_first(), Some(TaskModelType::GptImage1p5));
      assert_eq!(variants.pop_first(), Some(TaskModelType::Seedream4));
      assert_eq!(variants.pop_first(), Some(TaskModelType::Seedream4p5));
      assert_eq!(variants.pop_first(), Some(TaskModelType::Seedream5Lite));
      assert_eq!(variants.pop_first(), Some(TaskModelType::GrokImage));
      assert_eq!(variants.pop_first(), Some(TaskModelType::Recraft3));
      assert_eq!(variants.pop_first(), Some(TaskModelType::Midjourney));
      // Video models
      assert_eq!(variants.pop_first(), Some(TaskModelType::GrokVideo));
      assert_eq!(variants.pop_first(), Some(TaskModelType::Kling16Pro));
      assert_eq!(variants.pop_first(), Some(TaskModelType::Kling21Pro));
      assert_eq!(variants.pop_first(), Some(TaskModelType::Kling21Master));
      assert_eq!(variants.pop_first(), Some(TaskModelType::Kling2p5TurboPro));
      assert_eq!(variants.pop_first(), Some(TaskModelType::Kling2p6Pro));
      assert_eq!(variants.pop_first(), Some(TaskModelType::Seedance10Lite));
      assert_eq!(variants.pop_first(), Some(TaskModelType::Seedance1p5Pro));
      assert_eq!(variants.pop_first(), Some(TaskModelType::Seedance2p0));
      assert_eq!(variants.pop_first(), Some(TaskModelType::Sora2));
      assert_eq!(variants.pop_first(), Some(TaskModelType::Sora2Pro));
      assert_eq!(variants.pop_first(), Some(TaskModelType::Veo2));
      assert_eq!(variants.pop_first(), Some(TaskModelType::Veo3));
      assert_eq!(variants.pop_first(), Some(TaskModelType::Veo3Fast));
      assert_eq!(variants.pop_first(), Some(TaskModelType::Veo3p1));
      assert_eq!(variants.pop_first(), Some(TaskModelType::Veo3p1Fast));
      // 3D Object generation models
      assert_eq!(variants.pop_first(), Some(TaskModelType::Hunyuan3d2_0));
      assert_eq!(variants.pop_first(), Some(TaskModelType::Hunyuan3d2_1));
      assert_eq!(variants.pop_first(), Some(TaskModelType::Hunyuan3d3));
      assert_eq!(variants.pop_first(), Some(TaskModelType::WorldlabsMarble));
      assert_eq!(variants.pop_first(), None);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn variant_length() {
      use strum::IntoEnumIterator;
      assert_eq!(TaskModelType::all_variants().len(), TaskModelType::iter().len());
    }

    #[test]
    fn round_trip() {
      for variant in TaskModelType::all_variants() {
        // Test to_str(), from_str(), Display, and Debug.
        assert_eq!(variant, TaskModelType::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, TaskModelType::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, TaskModelType::from_str(&format!("{:?}", variant)).unwrap());
      }
    }

    #[test]
    fn serialized_length_ok_for_database() {
      const MAX_LENGTH : usize = 24;
      for variant in TaskModelType::all_variants() {
        let serialized = variant.to_str();
        assert!(serialized.len() > 0, "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long", variant);
      }
    }
  }
}
