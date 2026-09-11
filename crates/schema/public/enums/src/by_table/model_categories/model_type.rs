use serde::Deserialize;
use serde::Serialize;
#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;

/// Used in the `model_categories` table in an `ENUM` field.
/// (*WE WANT TO STOP USING ENUM FIELDS DUE TO MIGRATION ISSUES*)
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, Eq, PartialEq, Hash, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum ModelType {
  Tts,
  W2l,
}

// TODO(bt, 2023-01-16): This desperately needs MySQL integration tests!
impl_enum_display_and_debug_using_to_str!(ModelType);
impl_mysql_enum_coders!(ModelType);

/// NB: Legacy API for older code.
impl ModelType {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::Tts => "tts",
      Self::W2l => "w2l",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "tts" => Ok(Self::Tts),
      "w2l" => Ok(Self::W2l),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }
}

#[cfg(test)]
mod tests {
  use crate::by_table::model_categories::model_type::ModelType;
  use crate::test_helpers::assert_serialization;

  #[test]
  fn test_serialization() {
    assert_serialization(ModelType::Tts, "tts");
    assert_serialization(ModelType::W2l, "w2l");
  }

  #[test]
  fn test_to_str() {
    assert_eq!(ModelType::Tts.to_str(), "tts");
    assert_eq!(ModelType::W2l.to_str(), "w2l");
  }

  #[test]
  fn test_from_str() {
    assert_eq!(ModelType::from_str("tts").unwrap(), ModelType::Tts);
    assert_eq!(ModelType::from_str("w2l").unwrap(), ModelType::W2l);
    assert!(ModelType::from_str("foo").is_err());
  }
}
