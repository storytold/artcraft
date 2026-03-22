use strum::EnumCount;
use strum::EnumIter;

/// Used in the `trending_model_analytics` table in a `VARCHAR` field.
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[derive(Clone, Copy, Eq, PartialEq, Deserialize, Serialize, EnumIter, EnumCount)]
#[serde(rename_all = "lowercase")]
pub enum ModelType {
  /// TTS models
  Tts,

  // NB: It's assumed we'll use this same system to track
  // trending VC models too, so the next type would be "VC".
}

// TODO(bt, 2023-01-17): This desperately needs MySQL integration tests!
impl_enum_display_and_debug_using_to_str!(ModelType);
impl_mysql_enum_coders!(ModelType);
impl_mysql_from_row!(ModelType);

/// NB: Legacy API for older code.
impl ModelType {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::Tts => "tts",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "tts" => Ok(Self::Tts),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }
}

#[cfg(test)]
mod tests {
  use super::super::model_type::ModelType;
  use enums_shared::test_helpers::assert_serialization;

  #[test]
  fn test_serialization() {
    assert_serialization(ModelType::Tts, "tts");
  }

  #[test]
  fn test_to_str() {
    assert_eq!(ModelType::Tts.to_str(), "tts");
  }

  #[test]
  fn test_from_str() {
    assert_eq!(ModelType::from_str("tts").unwrap(), ModelType::Tts);
    assert!(ModelType::from_str("foo").is_err());
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip() {
      use strum::IntoEnumIterator;
      for variant in ModelType::iter() {
        assert_eq!(variant, ModelType::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, ModelType::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, ModelType::from_str(&format!("{:?}", variant)).unwrap());
      }
    }

    #[test]
    fn serialized_length_ok_for_database() {
      const MAX_LENGTH: usize = 32; // TODO(bt): Confirm database column width, then remove this comment.
      use strum::IntoEnumIterator;
      for variant in ModelType::iter() {
        let serialized = variant.to_str();
        assert!(!serialized.is_empty(), "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long", variant);
      }
    }
  }
}
