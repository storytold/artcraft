use utoipa::ToSchema;

#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;

/// Image models available for generation.
/// Mirrors artcraft_router::api::common_image_model::CommonImageModel.
#[derive(Copy, Clone, Debug, PartialEq, Eq, Serialize, Deserialize, ToSchema)]
#[cfg_attr(test, derive(EnumIter, EnumCount))]
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
  #[serde(rename = "gpt_image_1")]
  GptImage1,
  #[serde(rename = "gpt_image_1p5")]
  GptImage1p5,
  #[serde(rename = "gpt_image_2")]
  GptImage2,
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
}

impl CommonImageModel {
  pub fn to_common_model_type(&self) -> crate::common::generation::common_model_type::CommonModelType {
    use crate::common::generation::common_model_type::CommonModelType;
    match self {
      Self::Flux1Dev => CommonModelType::Flux1Dev,
      Self::Flux1Schnell => CommonModelType::Flux1Schnell,
      Self::FluxPro11 => CommonModelType::FluxPro11,
      Self::FluxPro11Ultra => CommonModelType::FluxPro11Ultra,
      Self::GptImage1 => CommonModelType::GptImage1,
      Self::GptImage1p5 => CommonModelType::GptImage1p5,
      Self::GptImage2 => CommonModelType::GptImage2,
      Self::NanoBanana => CommonModelType::NanoBanana,
      Self::NanoBanana2 => CommonModelType::NanoBanana2,
      Self::NanoBananaPro => CommonModelType::NanoBananaPro,
      Self::Seedream4 => CommonModelType::Seedream4,
      Self::Seedream4p5 => CommonModelType::Seedream4p5,
      Self::Seedream5Lite => CommonModelType::Seedream5Lite,
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::common::generation::common_model_class::CommonModelClass;
  use crate::common::generation::common_model_type::CommonModelType;
  use crate::test_helpers::assert_serialization;

  mod explicit_checks {
    use super::*;

    #[test]
    fn serialization() {
      assert_serialization(CommonImageModel::Flux1Dev, "flux_1_dev");
      assert_serialization(CommonImageModel::Flux1Schnell, "flux_1_schnell");
      assert_serialization(CommonImageModel::FluxPro11, "flux_pro_1p1");
      assert_serialization(CommonImageModel::FluxPro11Ultra, "flux_pro_1p1_ultra");
      assert_serialization(CommonImageModel::GptImage1, "gpt_image_1");
      assert_serialization(CommonImageModel::GptImage1p5, "gpt_image_1p5");
      assert_serialization(CommonImageModel::GptImage2, "gpt_image_2");
      assert_serialization(CommonImageModel::NanoBanana, "nano_banana");
      assert_serialization(CommonImageModel::NanoBanana2, "nano_banana_2");
      assert_serialization(CommonImageModel::NanoBananaPro, "nano_banana_pro");
      assert_serialization(CommonImageModel::Seedream4, "seedream_4");
      assert_serialization(CommonImageModel::Seedream4p5, "seedream_4p5");
      assert_serialization(CommonImageModel::Seedream5Lite, "seedream_5_lite");
    }

    #[test]
    fn all_image_models_convert_to_common_model_type() {
      let models = [
        (CommonImageModel::Flux1Dev, CommonModelType::Flux1Dev),
        (CommonImageModel::Flux1Schnell, CommonModelType::Flux1Schnell),
        (CommonImageModel::FluxPro11, CommonModelType::FluxPro11),
        (CommonImageModel::FluxPro11Ultra, CommonModelType::FluxPro11Ultra),
        (CommonImageModel::GptImage1, CommonModelType::GptImage1),
        (CommonImageModel::GptImage1p5, CommonModelType::GptImage1p5),
        (CommonImageModel::GptImage2, CommonModelType::GptImage2),
        (CommonImageModel::NanoBanana, CommonModelType::NanoBanana),
        (CommonImageModel::NanoBanana2, CommonModelType::NanoBanana2),
        (CommonImageModel::NanoBananaPro, CommonModelType::NanoBananaPro),
        (CommonImageModel::Seedream4, CommonModelType::Seedream4),
        (CommonImageModel::Seedream4p5, CommonModelType::Seedream4p5),
        (CommonImageModel::Seedream5Lite, CommonModelType::Seedream5Lite),
      ];
      for (image_model, expected) in models {
        assert_eq!(image_model.to_common_model_type(), expected);
      }
    }

    #[test]
    fn all_image_models_map_to_image_class() {
      use strum::IntoEnumIterator;
      for variant in CommonImageModel::iter() {
        let model_type = variant.to_common_model_type();
        assert_eq!(
          model_type.get_model_class(), CommonModelClass::Image,
          "{:?} mapped to {:?} which has class {:?}, expected Image",
          variant, model_type, model_type.get_model_class(),
        );
      }
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn variant_count() {
      use strum::IntoEnumIterator;
      assert_eq!(CommonImageModel::iter().len(), 13);
    }

    #[test]
    fn serde_round_trip() {
      use strum::IntoEnumIterator;
      for variant in CommonImageModel::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let deserialized: CommonImageModel = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, deserialized, "round-trip failed for {:?}", variant);
      }
    }

    #[test]
    fn serialized_names_are_lowercase_alphanumeric_underscore() {
      use strum::IntoEnumIterator;
      let valid = regex::Regex::new(r"^[a-z0-9_]+$").unwrap();
      for variant in CommonImageModel::iter() {
        let json = serde_json::to_string(&variant).unwrap().replace('"', "");
        assert!(
          valid.is_match(&json),
          "{:?} serializes to {:?} which contains invalid characters",
          variant, json,
        );
      }
    }

    #[test]
    fn to_common_model_type_covers_all_variants() {
      use strum::IntoEnumIterator;
      // This test ensures to_common_model_type doesn't panic for any variant.
      for variant in CommonImageModel::iter() {
        let _ = variant.to_common_model_type();
      }
    }
  }
}
