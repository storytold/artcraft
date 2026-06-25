use serde_derive::{Deserialize, Serialize};

/// Common video models supported by the router.
/// Not all models are available through all providers.
#[derive(Copy, Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RouterVideoModel {
  #[serde(rename = "grok_video")]
  GrokVideo,

  #[serde(rename = "grok_imagine_video")]
  GrokImagineVideo,

  #[serde(rename = "grok_imagine_video_1p5")]
  GrokImagineVideo1p5,

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

  #[serde(rename = "seedance_1p5_pro")]
  Seedance1p5Pro,

  #[serde(rename = "seedance_2p0")]
  Seedance2p0,

  #[serde(rename = "seedance_2p0_fast")]
  Seedance2p0Fast,

  #[serde(rename = "seedance_2p0_bp")]
  Seedance2p0BytePlus,

  #[serde(rename = "seedance_2p0_bp_fast")]
  Seedance2p0BytePlusFast,

  #[serde(rename = "seedance_2p0_u")]
  Seedance2p0Ultra,

  #[serde(rename = "seedance_2p0_u_fast")]
  Seedance2p0UltraFast,

  #[serde(rename = "seedance_2p0_bpu")]
  Seedance2p0BytePlusUltra,

  #[serde(rename = "seedance_2p0_bpu_fast")]
  Seedance2p0BytePlusUltraFast,

  #[serde(rename = "seedance_2p0_mini")]
  Seedance2p0Mini,

  #[serde(rename = "seedance_2p0_bp_mini")]
  Seedance2p0BytePlusMini,

  #[serde(rename = "seedance_2p0_bpu_mini")]
  Seedance2p0BytePlusUltraMini,

  #[serde(rename = "happy_horse_1p0")]
  HappyHorse1p0,

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

  #[serde(rename = "preview_model")]
  PreviewModel,

  #[serde(rename = "preview_model_fast")]
  PreviewModelFast,
}

#[cfg(test)]
mod tests {
  use super::*;

  fn assert_serde_round_trip(model: RouterVideoModel, expected: &str) {
    let json = serde_json::to_string(&model).unwrap();
    assert_eq!(json, format!("\"{expected}\""));
    let parsed: RouterVideoModel = serde_json::from_str(&json).unwrap();
    // RouterVideoModel isn't PartialEq, so round-trip back to the wire form.
    assert_eq!(serde_json::to_string(&parsed).unwrap(), json);
  }

  #[test]
  fn seedance_2p0_mini_variants_serialize() {
    assert_serde_round_trip(RouterVideoModel::Seedance2p0Mini, "seedance_2p0_mini");
    assert_serde_round_trip(RouterVideoModel::Seedance2p0BytePlusMini, "seedance_2p0_bp_mini");
    assert_serde_round_trip(RouterVideoModel::Seedance2p0BytePlusUltraMini, "seedance_2p0_bpu_mini");
  }
}
