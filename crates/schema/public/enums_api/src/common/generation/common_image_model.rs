use strum::EnumIter;
use utoipa::ToSchema;

/// Image models available for generation.
/// Mirrors artcraft_router::api::common_image_model::CommonImageModel.
#[derive(Copy, Clone, Debug, PartialEq, Serialize, Deserialize, ToSchema, EnumIter)]
#[serde(rename_all = "snake_case")]
pub enum CommonImageModel {
  #[serde(rename = "flux_1_dev")]
  Flux1Dev,
  #[serde(rename = "flux_1_schnell")]
  Flux1Schnell,
  #[serde(rename = "flux_pro_1p1")]
  FluxPro11,
  #[serde(rename = "flux_pro_1p1_ultra")]
  FluxPro11Ultra,
  #[serde(rename = "gpt_image_1p5")]
  GptImage1p5,
  #[serde(rename = "nano_banana")]
  NanaBanana,
  #[serde(rename = "nano_banana_2")]
  NanaBanana2,
  #[serde(rename = "nano_banana_pro")]
  NanaBananaPro,
  #[serde(rename = "seedream_4")]
  Seedream4,
  #[serde(rename = "seedream_4p5")]
  Seedream4p5,
  #[serde(rename = "seedream_5_lite")]
  Seedream5Lite,
}

#[cfg(test)]
mod tests {
  use super::CommonImageModel;
  use enums_shared::test_helpers::{assert_deserialization, assert_serialization};
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(CommonImageModel::Flux1Dev, "flux_1_dev");
      assert_serialization(CommonImageModel::Flux1Schnell, "flux_1_schnell");
      assert_serialization(CommonImageModel::FluxPro11, "flux_pro_1p1");
      assert_serialization(CommonImageModel::FluxPro11Ultra, "flux_pro_1p1_ultra");
      assert_serialization(CommonImageModel::GptImage1p5, "gpt_image_1p5");
      assert_serialization(CommonImageModel::NanaBanana, "nano_banana");
      assert_serialization(CommonImageModel::NanaBanana2, "nano_banana_2");
      assert_serialization(CommonImageModel::NanaBananaPro, "nano_banana_pro");
      assert_serialization(CommonImageModel::Seedream4, "seedream_4");
      assert_serialization(CommonImageModel::Seedream4p5, "seedream_4p5");
      assert_serialization(CommonImageModel::Seedream5Lite, "seedream_5_lite");
    }

    #[test]
    fn test_deserialization() {
      assert_deserialization("flux_1_dev", CommonImageModel::Flux1Dev);
      assert_deserialization("flux_1_schnell", CommonImageModel::Flux1Schnell);
      assert_deserialization("flux_pro_1p1", CommonImageModel::FluxPro11);
      assert_deserialization("flux_pro_1p1_ultra", CommonImageModel::FluxPro11Ultra);
      assert_deserialization("gpt_image_1p5", CommonImageModel::GptImage1p5);
      assert_deserialization("nano_banana", CommonImageModel::NanaBanana);
      assert_deserialization("nano_banana_2", CommonImageModel::NanaBanana2);
      assert_deserialization("nano_banana_pro", CommonImageModel::NanaBananaPro);
      assert_deserialization("seedream_4", CommonImageModel::Seedream4);
      assert_deserialization("seedream_4p5", CommonImageModel::Seedream4p5);
      assert_deserialization("seedream_5_lite", CommonImageModel::Seedream5Lite);
    }

    #[test]
    fn variants_count_check() {
      assert_eq!(CommonImageModel::iter().count(), 11);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in CommonImageModel::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: CommonImageModel = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
