use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `voice_conversion_models` table in `VARCHAR(32)` field `model_type`.
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize, ToSchema, EnumIter, Debug)]

pub enum VoiceConversionModelType {
  // We're skipping RVC "v1" models as "v2" are much higher quality.
  // Future incompatible upgrades may deserve a different enum variant.
  #[serde(rename = "rvc_v2")]
  RvcV2,

  #[serde(rename = "soft_vc")]
  SoftVc,

  #[serde(rename = "so_vits_svc")]
  SoVitsSvc,
}

#[cfg(test)]
mod tests {
  use super::VoiceConversionModelType;
  use enums_shared::test_helpers::{assert_deserialization, assert_serialization};
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(VoiceConversionModelType::RvcV2, "rvc_v2");
      assert_serialization(VoiceConversionModelType::SoftVc, "soft_vc");
      assert_serialization(VoiceConversionModelType::SoVitsSvc, "so_vits_svc");
    }

    #[test]
    fn test_deserialization() {
      assert_deserialization("rvc_v2", VoiceConversionModelType::RvcV2);
      assert_deserialization("soft_vc", VoiceConversionModelType::SoftVc);
      assert_deserialization("so_vits_svc", VoiceConversionModelType::SoVitsSvc);
    }

    #[test]
    fn variants_count_check() {
      assert_eq!(VoiceConversionModelType::iter().count(), 3);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in VoiceConversionModelType::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: VoiceConversionModelType = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
