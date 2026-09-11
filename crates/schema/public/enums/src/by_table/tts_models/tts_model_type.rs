use serde::Deserialize;
use serde::Serialize;
#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;

/// Used in the `tts_models` table in an `ENUM` field.
/// -- Furthermore -- not all enum values are represented !!
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, Eq, PartialEq, Deserialize, Serialize)]
pub enum TtsModelType {
  #[serde(rename = "tacotron2")]
  Tacotron2,

  #[serde(rename = "vits")]
  Vits,
}

// TODO(bt, 2023-04-03): This desperately needs MySQL integration tests!
impl_enum_display_and_debug_using_to_str!(TtsModelType);
impl_mysql_enum_coders!(TtsModelType);

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
  use crate::by_table::tts_models::tts_model_type::TtsModelType;
  use crate::test_helpers::assert_serialization;

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
}
