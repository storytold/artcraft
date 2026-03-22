use strum::EnumCount;
use strum::EnumIter;

/// Used in the `voice_conversion_models` table in `VARCHAR(32)` field `model_type`.
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize, EnumIter, EnumCount)]
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

// TODO(bt, 2022-12-21): This desperately needs MySQL integration tests!
impl_enum_display_and_debug_using_to_str!(VoiceConversionModelType);
impl_mysql_enum_coders!(VoiceConversionModelType);
impl_mysql_from_row!(VoiceConversionModelType);

/// NB: Legacy API for older code.
impl VoiceConversionModelType {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::RvcV2 => "rvc_v2",
      Self::SoftVc => "soft_vc",
      Self::SoVitsSvc => "so_vits_svc",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "rvc_v2" => Ok(Self::RvcV2),
      "soft_vc" => Ok(Self::SoftVc),
      "so_vits_svc" => Ok(Self::SoVitsSvc),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }

}

#[cfg(test)]
mod tests {
  use super::super::voice_conversion_model_type::VoiceConversionModelType;
  use enums_shared::test_helpers::assert_serialization;

  #[test]
  fn test_serialization() {
    assert_serialization(VoiceConversionModelType::RvcV2, "rvc_v2");
    assert_serialization(VoiceConversionModelType::SoftVc, "soft_vc");
    assert_serialization(VoiceConversionModelType::SoVitsSvc, "so_vits_svc");
  }

  #[test]
  fn to_str() {
    assert_eq!(VoiceConversionModelType::RvcV2.to_str(), "rvc_v2");
    assert_eq!(VoiceConversionModelType::SoftVc.to_str(), "soft_vc");
    assert_eq!(VoiceConversionModelType::SoVitsSvc.to_str(), "so_vits_svc");
  }

  #[test]
  fn from_str() {
    assert_eq!(VoiceConversionModelType::from_str("rvc_v2").unwrap(), VoiceConversionModelType::RvcV2);
    assert_eq!(VoiceConversionModelType::from_str("soft_vc").unwrap(), VoiceConversionModelType::SoftVc);
    assert_eq!(VoiceConversionModelType::from_str("so_vits_svc").unwrap(), VoiceConversionModelType::SoVitsSvc);
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip() {
      use strum::IntoEnumIterator;
      for variant in VoiceConversionModelType::iter() {
        assert_eq!(variant, VoiceConversionModelType::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, VoiceConversionModelType::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, VoiceConversionModelType::from_str(&format!("{:?}", variant)).unwrap());
      }
    }

    #[test]
    fn serialized_length_ok_for_database() {
      const MAX_LENGTH: usize = 32; // TODO(bt): Confirm database column width, then remove this comment.
      use strum::IntoEnumIterator;
      for variant in VoiceConversionModelType::iter() {
        let serialized = variant.to_str();
        assert!(!serialized.is_empty(), "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long", variant);
      }
    }
  }
}
