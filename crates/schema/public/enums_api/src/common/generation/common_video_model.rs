use strum::EnumIter;
use utoipa::ToSchema;

/// Video models available for generation.
/// Mirrors artcraft_router::api::common_video_model::CommonVideoModel.
#[derive(Copy, Clone, Debug, PartialEq, Serialize, Deserialize, ToSchema, EnumIter)]
#[serde(rename_all = "snake_case")]
pub enum CommonVideoModel {
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
}

#[cfg(test)]
mod tests {
  use super::CommonVideoModel;
  use enums_shared::test_helpers::{assert_deserialization, assert_serialization};
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(CommonVideoModel::GrokVideo, "grok_video");
      assert_serialization(CommonVideoModel::Kling16Pro, "kling_1p6_pro");
      assert_serialization(CommonVideoModel::Kling21Pro, "kling_2p1_pro");
      assert_serialization(CommonVideoModel::Kling21Master, "kling_2p1_master");
      assert_serialization(CommonVideoModel::Kling2p5TurboPro, "kling_2p5_turbo_pro");
      assert_serialization(CommonVideoModel::Kling2p6Pro, "kling_2p6_pro");
      assert_serialization(CommonVideoModel::Kling3p0Standard, "kling_3p0_standard");
      assert_serialization(CommonVideoModel::Kling3p0Pro, "kling_3p0_pro");
      assert_serialization(CommonVideoModel::Seedance10Lite, "seedance_1p0_lite");
      assert_serialization(CommonVideoModel::Seedance1p5Pro, "seedance_1p5_pro");
      assert_serialization(CommonVideoModel::Seedance2p0, "seedance_2p0");
      assert_serialization(CommonVideoModel::Sora2, "sora_2");
      assert_serialization(CommonVideoModel::Sora2Pro, "sora_2_pro");
      assert_serialization(CommonVideoModel::Veo2, "veo_2");
      assert_serialization(CommonVideoModel::Veo3, "veo_3");
      assert_serialization(CommonVideoModel::Veo3Fast, "veo_3_fast");
      assert_serialization(CommonVideoModel::Veo3p1, "veo_3p1");
      assert_serialization(CommonVideoModel::Veo3p1Fast, "veo_3p1_fast");
    }

    #[test]
    fn test_deserialization() {
      assert_deserialization("grok_video", CommonVideoModel::GrokVideo);
      assert_deserialization("kling_1p6_pro", CommonVideoModel::Kling16Pro);
      assert_deserialization("kling_2p1_pro", CommonVideoModel::Kling21Pro);
      assert_deserialization("kling_2p1_master", CommonVideoModel::Kling21Master);
      assert_deserialization("kling_2p5_turbo_pro", CommonVideoModel::Kling2p5TurboPro);
      assert_deserialization("kling_2p6_pro", CommonVideoModel::Kling2p6Pro);
      assert_deserialization("kling_3p0_standard", CommonVideoModel::Kling3p0Standard);
      assert_deserialization("kling_3p0_pro", CommonVideoModel::Kling3p0Pro);
      assert_deserialization("seedance_1p0_lite", CommonVideoModel::Seedance10Lite);
      assert_deserialization("seedance_1p5_pro", CommonVideoModel::Seedance1p5Pro);
      assert_deserialization("seedance_2p0", CommonVideoModel::Seedance2p0);
      assert_deserialization("sora_2", CommonVideoModel::Sora2);
      assert_deserialization("sora_2_pro", CommonVideoModel::Sora2Pro);
      assert_deserialization("veo_2", CommonVideoModel::Veo2);
      assert_deserialization("veo_3", CommonVideoModel::Veo3);
      assert_deserialization("veo_3_fast", CommonVideoModel::Veo3Fast);
      assert_deserialization("veo_3p1", CommonVideoModel::Veo3p1);
      assert_deserialization("veo_3p1_fast", CommonVideoModel::Veo3p1Fast);
    }

    #[test]
    fn variants_count_check() {
      assert_eq!(CommonVideoModel::iter().count(), 18);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in CommonVideoModel::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: CommonVideoModel = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
