use serde_derive::{Deserialize, Serialize};

/// Forward-compatible, self-contained API-client copy of the server's `CommonVideoModel` enum.
///
/// Serialized as a string. Any value this client build does not recognize is preserved
/// verbatim in [`Unknown`], so newer server variants never break deserialization and
/// still round-trip back to the original string.
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(from = "String", into = "String")]
pub enum ApiClientVideoModel {
  GrokVideo,
  GrokImagineVideo,
  GrokImagineVideo1p5,
  Kling16Pro,
  Kling21Pro,
  Kling21Master,
  Kling2p5TurboPro,
  Kling2p6Pro,
  Kling3p0Standard,
  Kling3p0Pro,
  HappyHorse1p0,
  Seedance10Lite,
  Seedance1p5Pro,
  Seedance2p0,
  Seedance2p0Fast,
  Seedance2p0BytePlus,
  Seedance2p0BytePlusFast,
  Seedance2p0Ultra,
  Seedance2p0UltraFast,
  Seedance2p0BytePlusUltra,
  Seedance2p0BytePlusUltraFast,
  Seedance2p0Mini,
  Seedance2p0BytePlusMini,
  Seedance2p0BytePlusUltraMini,
  Sora2,
  Sora2Pro,
  Veo2,
  Veo3,
  Veo3Fast,
  Veo3p1,
  Veo3p1Fast,
  PreviewModel,
  PreviewModelFast,
  /// A value not known to this client build (preserved as-is).
  Unknown(String),
}

impl From<String> for ApiClientVideoModel {
  fn from(value: String) -> Self {
    match value.as_str() {
      "grok_video" => Self::GrokVideo,
      "grok_imagine_video" => Self::GrokImagineVideo,
      "grok_imagine_video_1p5" => Self::GrokImagineVideo1p5,
      "kling_1p6_pro" => Self::Kling16Pro,
      "kling_2p1_pro" => Self::Kling21Pro,
      "kling_2p1_master" => Self::Kling21Master,
      "kling_2p5_turbo_pro" => Self::Kling2p5TurboPro,
      "kling_2p6_pro" => Self::Kling2p6Pro,
      "kling_3p0_standard" => Self::Kling3p0Standard,
      "kling_3p0_pro" => Self::Kling3p0Pro,
      "happy_horse_1p0" => Self::HappyHorse1p0,
      "seedance_1p0_lite" => Self::Seedance10Lite,
      "seedance_1p5_pro" => Self::Seedance1p5Pro,
      "seedance_2p0" => Self::Seedance2p0,
      "seedance_2p0_fast" => Self::Seedance2p0Fast,
      "seedance_2p0_bp" => Self::Seedance2p0BytePlus,
      "seedance_2p0_bp_fast" => Self::Seedance2p0BytePlusFast,
      "seedance_2p0_u" => Self::Seedance2p0Ultra,
      "seedance_2p0_u_fast" => Self::Seedance2p0UltraFast,
      "seedance_2p0_bpu" => Self::Seedance2p0BytePlusUltra,
      "seedance_2p0_bpu_fast" => Self::Seedance2p0BytePlusUltraFast,
      "seedance_2p0_mini" => Self::Seedance2p0Mini,
      "seedance_2p0_bp_mini" => Self::Seedance2p0BytePlusMini,
      "seedance_2p0_bpu_mini" => Self::Seedance2p0BytePlusUltraMini,
      "sora_2" => Self::Sora2,
      "sora_2_pro" => Self::Sora2Pro,
      "veo_2" => Self::Veo2,
      "veo_3" => Self::Veo3,
      "veo_3_fast" => Self::Veo3Fast,
      "veo_3p1" => Self::Veo3p1,
      "veo_3p1_fast" => Self::Veo3p1Fast,
      "preview_model" => Self::PreviewModel,
      "preview_model_fast" => Self::PreviewModelFast,
      _ => Self::Unknown(value),
    }
  }
}

impl From<ApiClientVideoModel> for String {
  fn from(value: ApiClientVideoModel) -> Self {
    match value {
      ApiClientVideoModel::GrokVideo => "grok_video".to_string(),
      ApiClientVideoModel::GrokImagineVideo => "grok_imagine_video".to_string(),
      ApiClientVideoModel::GrokImagineVideo1p5 => "grok_imagine_video_1p5".to_string(),
      ApiClientVideoModel::Kling16Pro => "kling_1p6_pro".to_string(),
      ApiClientVideoModel::Kling21Pro => "kling_2p1_pro".to_string(),
      ApiClientVideoModel::Kling21Master => "kling_2p1_master".to_string(),
      ApiClientVideoModel::Kling2p5TurboPro => "kling_2p5_turbo_pro".to_string(),
      ApiClientVideoModel::Kling2p6Pro => "kling_2p6_pro".to_string(),
      ApiClientVideoModel::Kling3p0Standard => "kling_3p0_standard".to_string(),
      ApiClientVideoModel::Kling3p0Pro => "kling_3p0_pro".to_string(),
      ApiClientVideoModel::HappyHorse1p0 => "happy_horse_1p0".to_string(),
      ApiClientVideoModel::Seedance10Lite => "seedance_1p0_lite".to_string(),
      ApiClientVideoModel::Seedance1p5Pro => "seedance_1p5_pro".to_string(),
      ApiClientVideoModel::Seedance2p0 => "seedance_2p0".to_string(),
      ApiClientVideoModel::Seedance2p0Fast => "seedance_2p0_fast".to_string(),
      ApiClientVideoModel::Seedance2p0BytePlus => "seedance_2p0_bp".to_string(),
      ApiClientVideoModel::Seedance2p0BytePlusFast => "seedance_2p0_bp_fast".to_string(),
      ApiClientVideoModel::Seedance2p0Ultra => "seedance_2p0_u".to_string(),
      ApiClientVideoModel::Seedance2p0UltraFast => "seedance_2p0_u_fast".to_string(),
      ApiClientVideoModel::Seedance2p0BytePlusUltra => "seedance_2p0_bpu".to_string(),
      ApiClientVideoModel::Seedance2p0BytePlusUltraFast => "seedance_2p0_bpu_fast".to_string(),
      ApiClientVideoModel::Seedance2p0Mini => "seedance_2p0_mini".to_string(),
      ApiClientVideoModel::Seedance2p0BytePlusMini => "seedance_2p0_bp_mini".to_string(),
      ApiClientVideoModel::Seedance2p0BytePlusUltraMini => "seedance_2p0_bpu_mini".to_string(),
      ApiClientVideoModel::Sora2 => "sora_2".to_string(),
      ApiClientVideoModel::Sora2Pro => "sora_2_pro".to_string(),
      ApiClientVideoModel::Veo2 => "veo_2".to_string(),
      ApiClientVideoModel::Veo3 => "veo_3".to_string(),
      ApiClientVideoModel::Veo3Fast => "veo_3_fast".to_string(),
      ApiClientVideoModel::Veo3p1 => "veo_3p1".to_string(),
      ApiClientVideoModel::Veo3p1Fast => "veo_3p1_fast".to_string(),
      ApiClientVideoModel::PreviewModel => "preview_model".to_string(),
      ApiClientVideoModel::PreviewModelFast => "preview_model_fast".to_string(),
      ApiClientVideoModel::Unknown(other) => other,
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn known_variant_round_trips() {
    let parsed: ApiClientVideoModel = serde_json::from_str("\"grok_video\"").unwrap();
    assert_eq!(parsed, ApiClientVideoModel::GrokVideo);
    assert_eq!(serde_json::to_string(&parsed).unwrap(), "\"grok_video\"");
  }

  #[test]
  fn unknown_value_is_preserved_and_round_trips() {
    let parsed: ApiClientVideoModel = serde_json::from_str("\"zzz_not_a_real_value\"").unwrap();
    assert_eq!(parsed, ApiClientVideoModel::Unknown("zzz_not_a_real_value".to_string()));
    assert_eq!(serde_json::to_string(&parsed).unwrap(), "\"zzz_not_a_real_value\"");
  }

  #[test]
  fn every_known_variant_round_trips() {
    let all = [
      (ApiClientVideoModel::GrokVideo, "grok_video"),
      (ApiClientVideoModel::GrokImagineVideo, "grok_imagine_video"),
      (ApiClientVideoModel::GrokImagineVideo1p5, "grok_imagine_video_1p5"),
      (ApiClientVideoModel::Kling16Pro, "kling_1p6_pro"),
      (ApiClientVideoModel::Kling21Pro, "kling_2p1_pro"),
      (ApiClientVideoModel::Kling21Master, "kling_2p1_master"),
      (ApiClientVideoModel::Kling2p5TurboPro, "kling_2p5_turbo_pro"),
      (ApiClientVideoModel::Kling2p6Pro, "kling_2p6_pro"),
      (ApiClientVideoModel::Kling3p0Standard, "kling_3p0_standard"),
      (ApiClientVideoModel::Kling3p0Pro, "kling_3p0_pro"),
      (ApiClientVideoModel::HappyHorse1p0, "happy_horse_1p0"),
      (ApiClientVideoModel::Seedance10Lite, "seedance_1p0_lite"),
      (ApiClientVideoModel::Seedance1p5Pro, "seedance_1p5_pro"),
      (ApiClientVideoModel::Seedance2p0, "seedance_2p0"),
      (ApiClientVideoModel::Seedance2p0Fast, "seedance_2p0_fast"),
      (ApiClientVideoModel::Seedance2p0BytePlus, "seedance_2p0_bp"),
      (ApiClientVideoModel::Seedance2p0BytePlusFast, "seedance_2p0_bp_fast"),
      (ApiClientVideoModel::Seedance2p0Ultra, "seedance_2p0_u"),
      (ApiClientVideoModel::Seedance2p0UltraFast, "seedance_2p0_u_fast"),
      (ApiClientVideoModel::Seedance2p0BytePlusUltra, "seedance_2p0_bpu"),
      (ApiClientVideoModel::Seedance2p0BytePlusUltraFast, "seedance_2p0_bpu_fast"),
      (ApiClientVideoModel::Seedance2p0Mini, "seedance_2p0_mini"),
      (ApiClientVideoModel::Seedance2p0BytePlusMini, "seedance_2p0_bp_mini"),
      (ApiClientVideoModel::Seedance2p0BytePlusUltraMini, "seedance_2p0_bpu_mini"),
      (ApiClientVideoModel::Sora2, "sora_2"),
      (ApiClientVideoModel::Sora2Pro, "sora_2_pro"),
      (ApiClientVideoModel::Veo2, "veo_2"),
      (ApiClientVideoModel::Veo3, "veo_3"),
      (ApiClientVideoModel::Veo3Fast, "veo_3_fast"),
      (ApiClientVideoModel::Veo3p1, "veo_3p1"),
      (ApiClientVideoModel::Veo3p1Fast, "veo_3p1_fast"),
      (ApiClientVideoModel::PreviewModel, "preview_model"),
      (ApiClientVideoModel::PreviewModelFast, "preview_model_fast"),
    ];
    for (variant, s) in all {
      assert_eq!(String::from(variant.clone()), s, "serialize mismatch for {:?}", variant);
      let parsed: ApiClientVideoModel = serde_json::from_str(&format!("\"{}\"", s)).unwrap();
      assert_eq!(parsed, variant);
    }
  }
}
