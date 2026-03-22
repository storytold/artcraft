use strum::EnumCount;
use strum::EnumIter;

/// Used in the `tts_models` table in an `ENUM` field.
/// -- Furthermore -- not all enum values are represented !!
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[derive(Clone, Copy, Eq, PartialEq, Deserialize, Serialize, EnumIter, EnumCount)]
pub enum TtsModelType {
  #[serde(rename = "tacotron2")]
  Tacotron2,

  #[serde(rename = "vits")]
  Vits,
}

// TODO(bt, 2023-04-03): This desperately needs MySQL integration tests!
impl_enum_display_and_debug_using_to_str!(TtsModelType);
impl_mysql_enum_coders!(TtsModelType);
impl_mysql_from_row!(TtsModelType);

/// NB: Legacy API for older code.
impl TtsModelType {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::Tacotron2 => "tacotron2",
      Self::Vits => "vits",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "tacotron2" => Ok(Self::Tacotron2),
      "vits" => Ok(Self::Vits),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }
}

#[cfg(test)]
mod tests {
  use super::super::tts_model_type::TtsModelType;
  use enums_shared::test_helpers::assert_serialization;

  #[test]
  fn test_serialization() {
    assert_serialization(TtsModelType::Tacotron2, "tacotron2");
    assert_serialization(TtsModelType::Vits, "vits");
  }

  #[test]
  fn test_to_str() {
    assert_eq!(TtsModelType::Tacotron2.to_str(), "tacotron2");
    assert_eq!(TtsModelType::Vits.to_str(), "vits");
  }

  #[test]
  fn test_from_str() {
    assert_eq!(TtsModelType::from_str("tacotron2").unwrap(), TtsModelType::Tacotron2);
    assert_eq!(TtsModelType::from_str("vits").unwrap(), TtsModelType::Vits);
    assert!(TtsModelType::from_str("foo").is_err());
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip() {
      use strum::IntoEnumIterator;
      for variant in TtsModelType::iter() {
        assert_eq!(variant, TtsModelType::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, TtsModelType::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, TtsModelType::from_str(&format!("{:?}", variant)).unwrap());
      }
    }

    #[test]
    fn serialized_length_ok_for_database() {
      const MAX_LENGTH: usize = 32; // TODO(bt): Confirm database column width, then remove this comment.
      use strum::IntoEnumIterator;
      for variant in TtsModelType::iter() {
        let serialized = variant.to_str();
        assert!(!serialized.is_empty(), "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long", variant);
      }
    }
  }
}
