use serde_derive::{Deserialize, Serialize};

/// Forward-compatible, self-contained API-client copy of the server's `CommonImageModel` enum.
///
/// Serialized as a string. Any value this client build does not recognize is preserved
/// verbatim in [`Unknown`], so newer server variants never break deserialization and
/// still round-trip back to the original string.
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(from = "String", into = "String")]
pub enum ApiClientImageModel {
  Flux1Dev,
  Flux1Schnell,
  FluxPro11,
  FluxPro11Ultra,
  GptImage1,
  GptImage1p5,
  GptImage2,
  GrokImagineImage,
  GrokImagineImageQuality,
  Midjourney7,
  Midjourney7Niji,
  Midjourney8,
  NanoBanana,
  NanoBanana2,
  NanoBananaPro,
  Seedream4,
  Seedream4p5,
  Seedream5Lite,
  QwenEdit2511Angles,
  Flux2LoraAngles,
  /// A value not known to this client build (preserved as-is).
  Unknown(String),
}

impl From<String> for ApiClientImageModel {
  fn from(value: String) -> Self {
    match value.as_str() {
      "flux_1_dev" => Self::Flux1Dev,
      "flux_1_schnell" => Self::Flux1Schnell,
      "flux_pro_1p1" => Self::FluxPro11,
      "flux_pro_1p1_ultra" => Self::FluxPro11Ultra,
      "gpt_image_1" => Self::GptImage1,
      "gpt_image_1p5" => Self::GptImage1p5,
      "gpt_image_2" => Self::GptImage2,
      "grok_imagine_image" => Self::GrokImagineImage,
      "grok_imagine_image_q" => Self::GrokImagineImageQuality,
      "midjourney_7" => Self::Midjourney7,
      "midjourney_7_niji" => Self::Midjourney7Niji,
      "midjourney_8" => Self::Midjourney8,
      "nano_banana" => Self::NanoBanana,
      "nano_banana_2" => Self::NanoBanana2,
      "nano_banana_pro" => Self::NanoBananaPro,
      "seedream_4" => Self::Seedream4,
      "seedream_4p5" => Self::Seedream4p5,
      "seedream_5_lite" => Self::Seedream5Lite,
      "qwen_edit_2511_angles" => Self::QwenEdit2511Angles,
      "flux_2_lora_angles" => Self::Flux2LoraAngles,
      _ => Self::Unknown(value),
    }
  }
}

impl From<ApiClientImageModel> for String {
  fn from(value: ApiClientImageModel) -> Self {
    match value {
      ApiClientImageModel::Flux1Dev => "flux_1_dev".to_string(),
      ApiClientImageModel::Flux1Schnell => "flux_1_schnell".to_string(),
      ApiClientImageModel::FluxPro11 => "flux_pro_1p1".to_string(),
      ApiClientImageModel::FluxPro11Ultra => "flux_pro_1p1_ultra".to_string(),
      ApiClientImageModel::GptImage1 => "gpt_image_1".to_string(),
      ApiClientImageModel::GptImage1p5 => "gpt_image_1p5".to_string(),
      ApiClientImageModel::GptImage2 => "gpt_image_2".to_string(),
      ApiClientImageModel::GrokImagineImage => "grok_imagine_image".to_string(),
      ApiClientImageModel::GrokImagineImageQuality => "grok_imagine_image_q".to_string(),
      ApiClientImageModel::Midjourney7 => "midjourney_7".to_string(),
      ApiClientImageModel::Midjourney7Niji => "midjourney_7_niji".to_string(),
      ApiClientImageModel::Midjourney8 => "midjourney_8".to_string(),
      ApiClientImageModel::NanoBanana => "nano_banana".to_string(),
      ApiClientImageModel::NanoBanana2 => "nano_banana_2".to_string(),
      ApiClientImageModel::NanoBananaPro => "nano_banana_pro".to_string(),
      ApiClientImageModel::Seedream4 => "seedream_4".to_string(),
      ApiClientImageModel::Seedream4p5 => "seedream_4p5".to_string(),
      ApiClientImageModel::Seedream5Lite => "seedream_5_lite".to_string(),
      ApiClientImageModel::QwenEdit2511Angles => "qwen_edit_2511_angles".to_string(),
      ApiClientImageModel::Flux2LoraAngles => "flux_2_lora_angles".to_string(),
      ApiClientImageModel::Unknown(other) => other,
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn known_variant_round_trips() {
    let parsed: ApiClientImageModel = serde_json::from_str("\"flux_1_dev\"").unwrap();
    assert_eq!(parsed, ApiClientImageModel::Flux1Dev);
    assert_eq!(serde_json::to_string(&parsed).unwrap(), "\"flux_1_dev\"");
  }

  #[test]
  fn unknown_value_is_preserved_and_round_trips() {
    let parsed: ApiClientImageModel = serde_json::from_str("\"zzz_not_a_real_value\"").unwrap();
    assert_eq!(parsed, ApiClientImageModel::Unknown("zzz_not_a_real_value".to_string()));
    assert_eq!(serde_json::to_string(&parsed).unwrap(), "\"zzz_not_a_real_value\"");
  }

  #[test]
  fn every_known_variant_round_trips() {
    let all = [
      (ApiClientImageModel::Flux1Dev, "flux_1_dev"),
      (ApiClientImageModel::Flux1Schnell, "flux_1_schnell"),
      (ApiClientImageModel::FluxPro11, "flux_pro_1p1"),
      (ApiClientImageModel::FluxPro11Ultra, "flux_pro_1p1_ultra"),
      (ApiClientImageModel::GptImage1, "gpt_image_1"),
      (ApiClientImageModel::GptImage1p5, "gpt_image_1p5"),
      (ApiClientImageModel::GptImage2, "gpt_image_2"),
      (ApiClientImageModel::GrokImagineImage, "grok_imagine_image"),
      (ApiClientImageModel::GrokImagineImageQuality, "grok_imagine_image_q"),
      (ApiClientImageModel::Midjourney7, "midjourney_7"),
      (ApiClientImageModel::Midjourney7Niji, "midjourney_7_niji"),
      (ApiClientImageModel::Midjourney8, "midjourney_8"),
      (ApiClientImageModel::NanoBanana, "nano_banana"),
      (ApiClientImageModel::NanoBanana2, "nano_banana_2"),
      (ApiClientImageModel::NanoBananaPro, "nano_banana_pro"),
      (ApiClientImageModel::Seedream4, "seedream_4"),
      (ApiClientImageModel::Seedream4p5, "seedream_4p5"),
      (ApiClientImageModel::Seedream5Lite, "seedream_5_lite"),
      (ApiClientImageModel::QwenEdit2511Angles, "qwen_edit_2511_angles"),
      (ApiClientImageModel::Flux2LoraAngles, "flux_2_lora_angles"),
    ];
    for (variant, s) in all {
      assert_eq!(String::from(variant.clone()), s, "serialize mismatch for {:?}", variant);
      let parsed: ApiClientImageModel = serde_json::from_str(&format!("\"{}\"", s)).unwrap();
      assert_eq!(parsed, variant);
    }
  }
}
