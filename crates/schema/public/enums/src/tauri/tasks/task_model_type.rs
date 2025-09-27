use std::collections::BTreeSet;

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
  #[serde(rename = "gpt_image_1")]
  GptImage1,
  #[serde(rename = "recraft_3")]
  Recraft3,
  
  // Generic Midjourney model, version unknown.
  #[serde(rename = "midjourney")]
  Midjourney,

  // Video models
  #[serde(rename = "kling_1.6_pro")]
  Kling16Pro,
  #[serde(rename = "kling_2.1_pro")]
  Kling21Pro,
  #[serde(rename = "kling_2.1_master")]
  Kling21Master,
  #[serde(rename = "seedance_1.0_lite")]
  Seedance10Lite,
  #[serde(rename = "veo_2")]
  Veo2,
  #[serde(rename = "veo_3")]
  Veo3,
  #[serde(rename = "veo_3_fast")]
  Veo3Fast,

  // 3D Object generation models
  #[serde(rename = "hunyuan_3d_2.0")]
  Hunyuan3d2_0,
  #[serde(rename = "hunyuan_3d_2.1")]
  Hunyuan3d2_1,
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
      Self::GptImage1 => "gpt_image_1",
      Self::Recraft3 => "recraft_3",
      Self::Midjourney => "midjourney",
      // Video models
      Self::Kling16Pro => "kling_1.6_pro",
      Self::Kling21Pro => "kling_2.1_pro",
      Self::Kling21Master => "kling_2.1_master",
      Self::Seedance10Lite => "seedance_1.0_lite",
      Self::Veo2 => "veo_2",
      Self::Veo3 => "veo_3",
      Self::Veo3Fast => "veo_3_fast",
      // 3D Object generation models
      Self::Hunyuan3d2_0 => "hunyuan_3d_2.0",
      Self::Hunyuan3d2_1 => "hunyuan_3d_2.1",
    }
  }

  pub fn from_str(job_status: &str) -> Result<Self, String> {
    match job_status {
      // Image models
      "flux_1_dev" => Ok(Self::Flux1Dev),
      "flux_1_schnell" => Ok(Self::Flux1Schnell),
      "flux_dev_juggernaut" => Ok(Self::FluxDevJuggernaut),
      "flux_pro_1" => Ok(Self::FluxPro1),
      "flux_pro_1.1" => Ok(Self::FluxPro11),
      "flux_pro_1.1_ultra" => Ok(Self::FluxPro11Ultra),
      "flux_pro_kontext_max" => Ok(Self::FluxProKontextMax),
      "gemini_25_flash" => Ok(Self::Gemini25Flash),
      "gpt_image_1" => Ok(Self::GptImage1),
      "recraft_3" => Ok(Self::Recraft3),
      "midjourney" => Ok(Self::Midjourney),
      // Video models
      "kling_1.6_pro" => Ok(Self::Kling16Pro),
      "kling_2.1_pro" => Ok(Self::Kling21Pro),
      "kling_2.1_master" => Ok(Self::Kling21Master),
      "seedance_1.0_lite" => Ok(Self::Seedance10Lite),
      "veo_2" => Ok(Self::Veo2),
      "veo_3" => Ok(Self::Veo3),
      "veo_3_fast" => Ok(Self::Veo3Fast),
      // 3D Object generation models
      "hunyuan_3d_2.0" => Ok(Self::Hunyuan3d2_0),
      "hunyuan_3d_2.1" => Ok(Self::Hunyuan3d2_1),
      _ => Err(format!("invalid task_model_type: {:?}", job_status)),
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
      Self::GptImage1,
      Self::Recraft3,
      Self::Midjourney,
      // Video models
      Self::Kling16Pro,
      Self::Kling21Pro,
      Self::Kling21Master,
      Self::Seedance10Lite,
      Self::Veo2,
      Self::Veo3,
      Self::Veo3Fast,
      // 3D Object generation models
      Self::Hunyuan3d2_0,
      Self::Hunyuan3d2_1,
    ])
  }
}

#[cfg(test)]
mod tests {
  use crate::tauri::tasks::task_model_type::TaskModelType;
  use crate::test_helpers::assert_serialization;

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
      assert_serialization(TaskModelType::GptImage1, "gpt_image_1");
      assert_serialization(TaskModelType::Recraft3, "recraft_3");
      assert_serialization(TaskModelType::Midjourney, "midjourney");
      // Video models
      assert_serialization(TaskModelType::Kling16Pro, "kling_1.6_pro");
      assert_serialization(TaskModelType::Kling21Pro, "kling_2.1_pro");
      assert_serialization(TaskModelType::Kling21Master, "kling_2.1_master");
      assert_serialization(TaskModelType::Seedance10Lite, "seedance_1.0_lite");
      assert_serialization(TaskModelType::Veo2, "veo_2");
      assert_serialization(TaskModelType::Veo3, "veo_3");
      assert_serialization(TaskModelType::Veo3Fast, "veo_3_fast");
      // 3D Object generation models
      assert_serialization(TaskModelType::Hunyuan3d2_0, "hunyuan_3d_2.0");
      assert_serialization(TaskModelType::Hunyuan3d2_1, "hunyuan_3d_2.1");
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
      assert_eq!(TaskModelType::GptImage1.to_str(), "gpt_image_1");
      assert_eq!(TaskModelType::Recraft3.to_str(), "recraft_3");
      assert_eq!(TaskModelType::Midjourney.to_str(), "midjourney");
      // Video models
      assert_eq!(TaskModelType::Kling16Pro.to_str(), "kling_1.6_pro");
      assert_eq!(TaskModelType::Kling21Pro.to_str(), "kling_2.1_pro");
      assert_eq!(TaskModelType::Kling21Master.to_str(), "kling_2.1_master");
      assert_eq!(TaskModelType::Seedance10Lite.to_str(), "seedance_1.0_lite");
      assert_eq!(TaskModelType::Veo2.to_str(), "veo_2");
      assert_eq!(TaskModelType::Veo3.to_str(), "veo_3");
      assert_eq!(TaskModelType::Veo3Fast.to_str(), "veo_3_fast");
      // 3D Object generation models
      assert_eq!(TaskModelType::Hunyuan3d2_0.to_str(), "hunyuan_3d_2.0");
      assert_eq!(TaskModelType::Hunyuan3d2_1.to_str(), "hunyuan_3d_2.1");
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
      assert_eq!(TaskModelType::from_str("gpt_image_1").unwrap(), TaskModelType::GptImage1);
      assert_eq!(TaskModelType::from_str("recraft_3").unwrap(), TaskModelType::Recraft3);
      assert_eq!(TaskModelType::from_str("midjourney").unwrap(), TaskModelType::Midjourney);
      // Video models
      assert_eq!(TaskModelType::from_str("kling_1.6_pro").unwrap(), TaskModelType::Kling16Pro);
      assert_eq!(TaskModelType::from_str("kling_2.1_pro").unwrap(), TaskModelType::Kling21Pro);
      assert_eq!(TaskModelType::from_str("kling_2.1_master").unwrap(), TaskModelType::Kling21Master);
      assert_eq!(TaskModelType::from_str("seedance_1.0_lite").unwrap(), TaskModelType::Seedance10Lite);
      assert_eq!(TaskModelType::from_str("veo_2").unwrap(), TaskModelType::Veo2);
      assert_eq!(TaskModelType::from_str("veo_3").unwrap(), TaskModelType::Veo3);
      assert_eq!(TaskModelType::from_str("veo_3_fast").unwrap(), TaskModelType::Veo3Fast);
      // 3D Object generation models
      assert_eq!(TaskModelType::from_str("hunyuan_3d_2.0").unwrap(), TaskModelType::Hunyuan3d2_0);
      assert_eq!(TaskModelType::from_str("hunyuan_3d_2.1").unwrap(), TaskModelType::Hunyuan3d2_1);
    }

    #[test]
    fn all_variants() {
      let mut variants = TaskModelType::all_variants();
      assert_eq!(variants.len(), 20);
      // Image models
      assert_eq!(variants.pop_first(), Some(TaskModelType::Flux1Dev));
      assert_eq!(variants.pop_first(), Some(TaskModelType::Flux1Schnell));
      assert_eq!(variants.pop_first(), Some(TaskModelType::FluxDevJuggernaut));
      assert_eq!(variants.pop_first(), Some(TaskModelType::FluxPro1));
      assert_eq!(variants.pop_first(), Some(TaskModelType::FluxPro11));
      assert_eq!(variants.pop_first(), Some(TaskModelType::FluxPro11Ultra));
      assert_eq!(variants.pop_first(), Some(TaskModelType::FluxProKontextMax));
      assert_eq!(variants.pop_first(), Some(TaskModelType::Gemini25Flash));
      assert_eq!(variants.pop_first(), Some(TaskModelType::GptImage1));
      assert_eq!(variants.pop_first(), Some(TaskModelType::Recraft3));
      assert_eq!(variants.pop_first(), Some(TaskModelType::Midjourney));
      // Video models
      assert_eq!(variants.pop_first(), Some(TaskModelType::Kling16Pro));
      assert_eq!(variants.pop_first(), Some(TaskModelType::Kling21Pro));
      assert_eq!(variants.pop_first(), Some(TaskModelType::Kling21Master));
      assert_eq!(variants.pop_first(), Some(TaskModelType::Seedance10Lite));
      assert_eq!(variants.pop_first(), Some(TaskModelType::Veo2));
      assert_eq!(variants.pop_first(), Some(TaskModelType::Veo3));
      assert_eq!(variants.pop_first(), Some(TaskModelType::Veo3Fast));
      // 3D Object generation models
      assert_eq!(variants.pop_first(), Some(TaskModelType::Hunyuan3d2_0));
      assert_eq!(variants.pop_first(), Some(TaskModelType::Hunyuan3d2_1));
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
