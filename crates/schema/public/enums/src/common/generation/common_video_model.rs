use utoipa::ToSchema;

/// Video models available for generation.
/// Mirrors artcraft_router::api::router_video_model::RouterVideoModel.
#[derive(Copy, Clone, Debug, Eq, PartialEq, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum CommonVideoModel {
  /// NB: This was for the web login version
  #[deprecated = "Use `GrokImagineVideo` instead."]
  #[serde(rename = "grok_video")]
  GrokVideo,

  /// NB: This is for the API version
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

  #[serde(rename = "happy_horse_1p0")]
  HappyHorse1p0,

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

  // NB: Temporary model rollout. Previously used for "Seedance 2.0 BytePlus".
  // This can be reused in the future.
  #[serde(rename = "preview_model")]
  PreviewModel,

  // NB: Temporary model rollout. Previously used for "Seedance 2.0 BytePlus Fast".
  // This can be reused in the future.
  #[serde(rename = "preview_model_fast")]
  PreviewModelFast,
}

impl CommonVideoModel {
  pub fn to_common_model_type(&self) -> crate::common::generation::common_model_type::CommonModelType {
    use crate::common::generation::common_model_type::CommonModelType;
    match self {
      Self::GrokVideo => CommonModelType::GrokVideo,
      Self::GrokImagineVideo => CommonModelType::GrokImagineVideo,
      Self::GrokImagineVideo1p5 => CommonModelType::GrokImagineVideo1p5,
      Self::Kling16Pro => CommonModelType::Kling16Pro,
      Self::Kling21Pro => CommonModelType::Kling21Pro,
      Self::Kling21Master => CommonModelType::Kling21Master,
      Self::Kling2p5TurboPro => CommonModelType::Kling2p5TurboPro,
      Self::Kling2p6Pro => CommonModelType::Kling2p6Pro,
      Self::Kling3p0Standard => CommonModelType::Kling3p0Standard,
      Self::Kling3p0Pro => CommonModelType::Kling3p0Pro,
      Self::HappyHorse1p0 => CommonModelType::HappyHorse1p0,
      Self::Seedance10Lite => CommonModelType::Seedance10Lite,
      Self::Seedance1p5Pro => CommonModelType::Seedance1p5Pro,
      Self::Seedance2p0 => CommonModelType::Seedance2p0,
      Self::Seedance2p0Fast => CommonModelType::Seedance2p0Fast,
      Self::Seedance2p0BytePlus => CommonModelType::Seedance2p0BytePlus,
      Self::Seedance2p0BytePlusFast => CommonModelType::Seedance2p0BytePlusFast,
      Self::Seedance2p0Ultra => CommonModelType::Seedance2p0Ultra,
      Self::Seedance2p0UltraFast => CommonModelType::Seedance2p0UltraFast,
      Self::Seedance2p0BytePlusUltra => CommonModelType::Seedance2p0BytePlusUltra,
      Self::Seedance2p0BytePlusUltraFast => CommonModelType::Seedance2p0BytePlusUltraFast,
      Self::Sora2 => CommonModelType::Sora2,
      Self::Sora2Pro => CommonModelType::Sora2Pro,
      Self::Veo2 => CommonModelType::Veo2,
      Self::Veo3 => CommonModelType::Veo3,
      Self::Veo3Fast => CommonModelType::Veo3Fast,
      Self::Veo3p1 => CommonModelType::Veo3p1,
      Self::Veo3p1Fast => CommonModelType::Veo3p1Fast,
      Self::PreviewModel => CommonModelType::PreviewModel,
      Self::PreviewModelFast => CommonModelType::PreviewModelFast,
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::common::generation::common_model_type::CommonModelType;
  use crate::test_helpers::assert_serialization;

  #[test]
  fn test_serialization() {
    assert_serialization(CommonVideoModel::GrokVideo, "grok_video");
    assert_serialization(CommonVideoModel::GrokImagineVideo, "grok_imagine_video");
    assert_serialization(CommonVideoModel::GrokImagineVideo1p5, "grok_imagine_video_1p5");
    assert_serialization(CommonVideoModel::Kling16Pro, "kling_1p6_pro");
    assert_serialization(CommonVideoModel::Kling21Pro, "kling_2p1_pro");
    assert_serialization(CommonVideoModel::Kling21Master, "kling_2p1_master");
    assert_serialization(CommonVideoModel::Kling2p5TurboPro, "kling_2p5_turbo_pro");
    assert_serialization(CommonVideoModel::Kling2p6Pro, "kling_2p6_pro");
    assert_serialization(CommonVideoModel::Kling3p0Standard, "kling_3p0_standard");
    assert_serialization(CommonVideoModel::Kling3p0Pro, "kling_3p0_pro");
    assert_serialization(CommonVideoModel::HappyHorse1p0, "happy_horse_1p0");
    assert_serialization(CommonVideoModel::Seedance10Lite, "seedance_1p0_lite");
    assert_serialization(CommonVideoModel::Seedance1p5Pro, "seedance_1p5_pro");
    assert_serialization(CommonVideoModel::Seedance2p0, "seedance_2p0");
    assert_serialization(CommonVideoModel::Seedance2p0Fast, "seedance_2p0_fast");
    assert_serialization(CommonVideoModel::Seedance2p0BytePlus, "seedance_2p0_bp");
    assert_serialization(CommonVideoModel::Seedance2p0BytePlusFast, "seedance_2p0_bp_fast");
    assert_serialization(CommonVideoModel::Seedance2p0Ultra, "seedance_2p0_u");
    assert_serialization(CommonVideoModel::Seedance2p0UltraFast, "seedance_2p0_u_fast");
    assert_serialization(CommonVideoModel::Seedance2p0BytePlusUltra, "seedance_2p0_bpu");
    assert_serialization(CommonVideoModel::Seedance2p0BytePlusUltraFast, "seedance_2p0_bpu_fast");
    assert_serialization(CommonVideoModel::Sora2, "sora_2");
    assert_serialization(CommonVideoModel::Sora2Pro, "sora_2_pro");
    assert_serialization(CommonVideoModel::Veo2, "veo_2");
    assert_serialization(CommonVideoModel::Veo3, "veo_3");
    assert_serialization(CommonVideoModel::Veo3Fast, "veo_3_fast");
    assert_serialization(CommonVideoModel::Veo3p1, "veo_3p1");
    assert_serialization(CommonVideoModel::Veo3p1Fast, "veo_3p1_fast");
    assert_serialization(CommonVideoModel::PreviewModel, "preview_model");
    assert_serialization(CommonVideoModel::PreviewModelFast, "preview_model_fast");
  }

  #[test]
  fn test_deserialization() {
    let cases = [
      ("grok_video", CommonVideoModel::GrokVideo),
      ("grok_imagine_video", CommonVideoModel::GrokImagineVideo),
      ("grok_imagine_video_1p5", CommonVideoModel::GrokImagineVideo1p5),
      ("kling_1p6_pro", CommonVideoModel::Kling16Pro),
      ("kling_2p1_pro", CommonVideoModel::Kling21Pro),
      ("kling_2p1_master", CommonVideoModel::Kling21Master),
      ("kling_2p5_turbo_pro", CommonVideoModel::Kling2p5TurboPro),
      ("kling_2p6_pro", CommonVideoModel::Kling2p6Pro),
      ("kling_3p0_standard", CommonVideoModel::Kling3p0Standard),
      ("kling_3p0_pro", CommonVideoModel::Kling3p0Pro),
      ("happy_horse_1p0", CommonVideoModel::HappyHorse1p0),
      ("seedance_1p0_lite", CommonVideoModel::Seedance10Lite),
      ("seedance_1p5_pro", CommonVideoModel::Seedance1p5Pro),
      ("seedance_2p0", CommonVideoModel::Seedance2p0),
      ("seedance_2p0_fast", CommonVideoModel::Seedance2p0Fast),
      ("seedance_2p0_bp", CommonVideoModel::Seedance2p0BytePlus),
      ("seedance_2p0_bp_fast", CommonVideoModel::Seedance2p0BytePlusFast),
      ("seedance_2p0_u", CommonVideoModel::Seedance2p0Ultra),
      ("seedance_2p0_u_fast", CommonVideoModel::Seedance2p0UltraFast),
      ("seedance_2p0_bpu", CommonVideoModel::Seedance2p0BytePlusUltra),
      ("seedance_2p0_bpu_fast", CommonVideoModel::Seedance2p0BytePlusUltraFast),
      ("sora_2", CommonVideoModel::Sora2),
      ("sora_2_pro", CommonVideoModel::Sora2Pro),
      ("veo_2", CommonVideoModel::Veo2),
      ("veo_3", CommonVideoModel::Veo3),
      ("veo_3_fast", CommonVideoModel::Veo3Fast),
      ("veo_3p1", CommonVideoModel::Veo3p1),
      ("veo_3p1_fast", CommonVideoModel::Veo3p1Fast),
      ("preview_model", CommonVideoModel::PreviewModel),
      ("preview_model_fast", CommonVideoModel::PreviewModelFast),
    ];
    for (json_str, expected) in cases {
      let json = format!("\"{}\"", json_str);
      let deserialized: CommonVideoModel = serde_json::from_str(&json)
        .unwrap_or_else(|e| panic!("Failed to deserialize {:?}: {}", json_str, e));
      assert_eq!(deserialized, expected, "Failed for {:?}", json_str);
    }
  }

  #[test]
  fn test_round_trip() {
    let all = [
      CommonVideoModel::GrokVideo,
      CommonVideoModel::GrokImagineVideo,
      CommonVideoModel::GrokImagineVideo1p5,
      CommonVideoModel::Kling16Pro,
      CommonVideoModel::Kling21Pro,
      CommonVideoModel::Kling21Master,
      CommonVideoModel::Kling2p5TurboPro,
      CommonVideoModel::Kling2p6Pro,
      CommonVideoModel::Kling3p0Standard,
      CommonVideoModel::Kling3p0Pro,
      CommonVideoModel::HappyHorse1p0,
      CommonVideoModel::Seedance10Lite,
      CommonVideoModel::Seedance1p5Pro,
      CommonVideoModel::Seedance2p0,
      CommonVideoModel::Seedance2p0Fast,
      CommonVideoModel::Seedance2p0BytePlus,
      CommonVideoModel::Seedance2p0BytePlusFast,
      CommonVideoModel::Seedance2p0Ultra,
      CommonVideoModel::Seedance2p0UltraFast,
      CommonVideoModel::Seedance2p0BytePlusUltra,
      CommonVideoModel::Seedance2p0BytePlusUltraFast,
      CommonVideoModel::Sora2,
      CommonVideoModel::Sora2Pro,
      CommonVideoModel::Veo2,
      CommonVideoModel::Veo3,
      CommonVideoModel::Veo3Fast,
      CommonVideoModel::Veo3p1,
      CommonVideoModel::Veo3p1Fast,
      CommonVideoModel::PreviewModel,
      CommonVideoModel::PreviewModelFast,
    ];
    for variant in all {
      let json = serde_json::to_string(&variant).unwrap();
      let deserialized: CommonVideoModel = serde_json::from_str(&json).unwrap();
      assert_eq!(variant, deserialized, "Round-trip failed for {:?}", variant);
    }
  }

  #[test]
  fn all_video_models_convert_to_common_model_type() {
    let models = [
      (CommonVideoModel::GrokVideo, CommonModelType::GrokVideo),
      (CommonVideoModel::GrokImagineVideo, CommonModelType::GrokImagineVideo),
      (CommonVideoModel::GrokImagineVideo1p5, CommonModelType::GrokImagineVideo1p5),
      (CommonVideoModel::Kling16Pro, CommonModelType::Kling16Pro),
      (CommonVideoModel::Kling21Pro, CommonModelType::Kling21Pro),
      (CommonVideoModel::Kling21Master, CommonModelType::Kling21Master),
      (CommonVideoModel::Kling2p5TurboPro, CommonModelType::Kling2p5TurboPro),
      (CommonVideoModel::Kling2p6Pro, CommonModelType::Kling2p6Pro),
      (CommonVideoModel::Kling3p0Standard, CommonModelType::Kling3p0Standard),
      (CommonVideoModel::Kling3p0Pro, CommonModelType::Kling3p0Pro),
      (CommonVideoModel::HappyHorse1p0, CommonModelType::HappyHorse1p0),
      (CommonVideoModel::Seedance10Lite, CommonModelType::Seedance10Lite),
      (CommonVideoModel::Seedance1p5Pro, CommonModelType::Seedance1p5Pro),
      (CommonVideoModel::Seedance2p0, CommonModelType::Seedance2p0),
      (CommonVideoModel::Seedance2p0Fast, CommonModelType::Seedance2p0Fast),
      (CommonVideoModel::Seedance2p0BytePlus, CommonModelType::Seedance2p0BytePlus),
      (CommonVideoModel::Seedance2p0BytePlusFast, CommonModelType::Seedance2p0BytePlusFast),
      (CommonVideoModel::Seedance2p0Ultra, CommonModelType::Seedance2p0Ultra),
      (CommonVideoModel::Seedance2p0UltraFast, CommonModelType::Seedance2p0UltraFast),
      (CommonVideoModel::Seedance2p0BytePlusUltra, CommonModelType::Seedance2p0BytePlusUltra),
      (CommonVideoModel::Seedance2p0BytePlusUltraFast, CommonModelType::Seedance2p0BytePlusUltraFast),
      (CommonVideoModel::Sora2, CommonModelType::Sora2),
      (CommonVideoModel::Sora2Pro, CommonModelType::Sora2Pro),
      (CommonVideoModel::Veo2, CommonModelType::Veo2),
      (CommonVideoModel::Veo3, CommonModelType::Veo3),
      (CommonVideoModel::Veo3Fast, CommonModelType::Veo3Fast),
      (CommonVideoModel::Veo3p1, CommonModelType::Veo3p1),
      (CommonVideoModel::Veo3p1Fast, CommonModelType::Veo3p1Fast),
      (CommonVideoModel::PreviewModel, CommonModelType::PreviewModel),
      (CommonVideoModel::PreviewModelFast, CommonModelType::PreviewModelFast),
    ];
    for (video_model, expected) in models {
      assert_eq!(video_model.to_common_model_type(), expected);
    }
  }
}
