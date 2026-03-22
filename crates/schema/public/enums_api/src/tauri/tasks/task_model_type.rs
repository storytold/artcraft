
use strum::EnumIter;
use utoipa::ToSchema;

#[derive(Clone, Debug, Copy, PartialEq, Eq, Hash, Ord, PartialOrd, Serialize, EnumIter, Deserialize, ToSchema)]
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
  #[serde(rename = "qwen_edit_2511_angles")]
  QwenEdit2511Angles,
  #[serde(rename = "flux_2_lora_angles")]
  Flux2LoraAngles,
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
  #[serde(rename = "kling_3p0_standard")]
  Kling3p0Standard,
  #[serde(rename = "kling_3p0_pro")]
  Kling3p0Pro,
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
  #[serde(rename = "marble_0p1_mini")]
  WorldlabsMarble0p1Mini,
  #[serde(rename = "marble_0p1_plus")]
  WorldlabsMarble0p1Plus,
}

#[cfg(test)]
mod tests {
  use super::TaskModelType;
  use enums_shared::test_helpers::{assert_deserialization, assert_serialization};
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn test_serialization() {
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
      assert_serialization(TaskModelType::QwenEdit2511Angles, "qwen_edit_2511_angles");
      assert_serialization(TaskModelType::Flux2LoraAngles, "flux_2_lora_angles");
      assert_serialization(TaskModelType::GrokImage, "grok_image");
      assert_serialization(TaskModelType::Recraft3, "recraft_3");
      assert_serialization(TaskModelType::Midjourney, "midjourney");
      assert_serialization(TaskModelType::GrokVideo, "grok_video");
      assert_serialization(TaskModelType::Kling16Pro, "kling_1.6_pro");
      assert_serialization(TaskModelType::Kling21Pro, "kling_2.1_pro");
      assert_serialization(TaskModelType::Kling21Master, "kling_2.1_master");
      assert_serialization(TaskModelType::Kling2p5TurboPro, "kling_2p5_turbo_pro");
      assert_serialization(TaskModelType::Kling2p6Pro, "kling_2p6_pro");
      assert_serialization(TaskModelType::Kling3p0Standard, "kling_3p0_standard");
      assert_serialization(TaskModelType::Kling3p0Pro, "kling_3p0_pro");
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
      assert_serialization(TaskModelType::Hunyuan3d2_0, "hunyuan_3d_2.0");
      assert_serialization(TaskModelType::Hunyuan3d2_1, "hunyuan_3d_2.1");
      assert_serialization(TaskModelType::Hunyuan3d3, "hunyuan_3d_3");
      assert_serialization(TaskModelType::WorldlabsMarble, "worldlabs_marble");
      assert_serialization(TaskModelType::WorldlabsMarble0p1Mini, "marble_0p1_mini");
      assert_serialization(TaskModelType::WorldlabsMarble0p1Plus, "marble_0p1_plus");
    }

    #[test]
    fn test_deserialization() {
      assert_deserialization("flux_1_dev", TaskModelType::Flux1Dev);
      assert_deserialization("flux_1_schnell", TaskModelType::Flux1Schnell);
      assert_deserialization("flux_dev_juggernaut", TaskModelType::FluxDevJuggernaut);
      assert_deserialization("flux_pro_1", TaskModelType::FluxPro1);
      assert_deserialization("flux_pro_1.1", TaskModelType::FluxPro11);
      assert_deserialization("flux_pro_1.1_ultra", TaskModelType::FluxPro11Ultra);
      assert_deserialization("flux_pro_kontext_max", TaskModelType::FluxProKontextMax);
      assert_deserialization("gemini_25_flash", TaskModelType::Gemini25Flash);
      assert_deserialization("nano_banana", TaskModelType::NanoBanana);
      assert_deserialization("nano_banana_2", TaskModelType::NanoBanana2);
      assert_deserialization("nano_banana_pro", TaskModelType::NanoBananaPro);
      assert_deserialization("gpt_image_1", TaskModelType::GptImage1);
      assert_deserialization("gpt_image_1p5", TaskModelType::GptImage1p5);
      assert_deserialization("seedream_4", TaskModelType::Seedream4);
      assert_deserialization("seedream_4p5", TaskModelType::Seedream4p5);
      assert_deserialization("seedream_5_lite", TaskModelType::Seedream5Lite);
      assert_deserialization("qwen_edit_2511_angles", TaskModelType::QwenEdit2511Angles);
      assert_deserialization("flux_2_lora_angles", TaskModelType::Flux2LoraAngles);
      assert_deserialization("grok_image", TaskModelType::GrokImage);
      assert_deserialization("recraft_3", TaskModelType::Recraft3);
      assert_deserialization("midjourney", TaskModelType::Midjourney);
      assert_deserialization("grok_video", TaskModelType::GrokVideo);
      assert_deserialization("kling_1.6_pro", TaskModelType::Kling16Pro);
      assert_deserialization("kling_2.1_pro", TaskModelType::Kling21Pro);
      assert_deserialization("kling_2.1_master", TaskModelType::Kling21Master);
      assert_deserialization("kling_2p5_turbo_pro", TaskModelType::Kling2p5TurboPro);
      assert_deserialization("kling_2p6_pro", TaskModelType::Kling2p6Pro);
      assert_deserialization("kling_3p0_standard", TaskModelType::Kling3p0Standard);
      assert_deserialization("kling_3p0_pro", TaskModelType::Kling3p0Pro);
      assert_deserialization("seedance_1.0_lite", TaskModelType::Seedance10Lite);
      assert_deserialization("seedance_1p5_pro", TaskModelType::Seedance1p5Pro);
      assert_deserialization("seedance_2p0", TaskModelType::Seedance2p0);
      assert_deserialization("sora_2", TaskModelType::Sora2);
      assert_deserialization("sora_2_pro", TaskModelType::Sora2Pro);
      assert_deserialization("veo_2", TaskModelType::Veo2);
      assert_deserialization("veo_3", TaskModelType::Veo3);
      assert_deserialization("veo_3_fast", TaskModelType::Veo3Fast);
      assert_deserialization("veo_3p1", TaskModelType::Veo3p1);
      assert_deserialization("veo_3p1_fast", TaskModelType::Veo3p1Fast);
      assert_deserialization("hunyuan_3d_2.0", TaskModelType::Hunyuan3d2_0);
      assert_deserialization("hunyuan_3d_2.1", TaskModelType::Hunyuan3d2_1);
      assert_deserialization("hunyuan_3d_3", TaskModelType::Hunyuan3d3);
      assert_deserialization("worldlabs_marble", TaskModelType::WorldlabsMarble);
      assert_deserialization("marble_0p1_mini", TaskModelType::WorldlabsMarble0p1Mini);
      assert_deserialization("marble_0p1_plus", TaskModelType::WorldlabsMarble0p1Plus);
    }

    #[test]
    fn variants_count_check() {
      assert_eq!(TaskModelType::iter().count(), 45);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in TaskModelType::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: TaskModelType = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
