use serde_derive::{Deserialize, Serialize};

/// Common image models supported by the router.
/// Not all models are available through all providers.
#[derive(Copy, Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RouterImageModel {
  #[serde(rename = "flux_1_dev")]
  Flux1Dev,
  #[serde(rename = "flux_1_schnell")]
  Flux1Schnell,
  #[serde(rename = "flux_pro_1p1")]
  FluxPro11,
  #[serde(rename = "flux_pro_1p1_ultra")]
  FluxPro11Ultra,
  #[serde(rename = "gpt_image_1")]
  GptImage1,
  #[serde(rename = "gpt_image_1p5")]
  GptImage1p5,
  #[serde(rename = "gpt_image_2")]
  GptImage2,
  #[serde(rename = "grok_imagine_image")]
  GrokImagineImage,
  #[serde(rename = "grok_imagine_image_q")]
  GrokImagineImageQuality,
  #[serde(rename = "midjourney_7")]
  Midjourney7,
  #[serde(rename = "midjourney_7_niji")]
  Midjourney7Niji,
  #[serde(rename = "midjourney_8")]
  Midjourney8,
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
  #[serde(rename = "qwen_edit_2511_angles")]
  QwenEdit2511Angles,
  #[serde(rename = "flux_2_lora_angles")]
  Flux2LoraAngles,
}

#[cfg(test)]
mod tests {
  use super::*;

  fn assert_round_trip(model: RouterImageModel, expected_wire: &str) {
    let json = serde_json::to_string(&model).unwrap();
    let unquoted = json.trim_matches('"');
    assert_eq!(unquoted, expected_wire, "serialize {:?}", model);
    let back: RouterImageModel = serde_json::from_str(&json).unwrap();
    assert_eq!(back, model, "deserialize round-trip for {:?}", model);
  }

  #[test]
  fn midjourney_7_serializes_to_midjourney_7() {
    assert_round_trip(RouterImageModel::Midjourney7, "midjourney_7");
  }

  #[test]
  fn midjourney_7_niji_serializes_to_midjourney_7_niji() {
    assert_round_trip(RouterImageModel::Midjourney7Niji, "midjourney_7_niji");
  }

  #[test]
  fn midjourney_8_serializes_to_midjourney_8() {
    assert_round_trip(RouterImageModel::Midjourney8, "midjourney_8");
  }
}
