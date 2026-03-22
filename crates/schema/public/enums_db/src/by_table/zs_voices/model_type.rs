use strum::EnumCount;
use strum::EnumIter;

/// Used in the `zs_voices` table in a `VARCHAR(16)` field named `model_type`.
///
/// This indicates what type of features are used in the embeddings.
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize, EnumIter, EnumCount)]
pub enum ZsVoiceModelType {
  /// TTS-type zero shot models
  #[serde(rename = "vall-e-x")]
  VallEX,
  #[serde(rename = "styletts2")]
  StyleTTS2,
}

// TODO(bt, 2023-01-17): This desperately needs MySQL integration tests!
impl_enum_display_and_debug_using_to_str!(ZsVoiceModelType);
impl_mysql_enum_coders!(ZsVoiceModelType);
impl_mysql_from_row!(ZsVoiceModelType);

/// NB: Legacy API for older code.
impl ZsVoiceModelType {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::VallEX=> "vall-e-x",
      Self::StyleTTS2 => "styletts2",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "vall-e-x" => Ok(Self::VallEX),
      "styletts2" => Ok(Self::StyleTTS2),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }

}

#[cfg(test)]
mod tests {
  use super::super::model_type::ZsVoiceModelType;
  use enums_shared::test_helpers::assert_serialization;

  mod serde {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(ZsVoiceModelType::VallEX, "vall-e-x");
    }
  }

  mod impl_methods {
    use super::*;

    #[test]
    fn to_str() {
      assert_eq!(ZsVoiceModelType::VallEX.to_str(), "vall-e-x");
      assert_eq!(ZsVoiceModelType::StyleTTS2.to_str(), "styletts2");
    }

    #[test]
    fn from_str() {
      assert_eq!(ZsVoiceModelType::from_str("vall-e-x").unwrap(), ZsVoiceModelType::VallEX);
      assert_eq!(ZsVoiceModelType::from_str("styletts2").unwrap(), ZsVoiceModelType::StyleTTS2);
      assert!(ZsVoiceModelType::from_str("foo").is_err());
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip() {
      use strum::IntoEnumIterator;
      for variant in ZsVoiceModelType::iter() {
        assert_eq!(variant, ZsVoiceModelType::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, ZsVoiceModelType::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, ZsVoiceModelType::from_str(&format!("{:?}", variant)).unwrap());
      }
    }
  
    #[test]
    fn serialized_length_ok_for_database() {
      const MAX_LENGTH: usize = 16; // TODO(bt): Confirm database column width, then remove this comment.
      use strum::IntoEnumIterator;
      for variant in ZsVoiceModelType::iter() {
        let serialized = variant.to_str();
        assert!(!serialized.is_empty(), "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long", variant);
      }
    }
  }
}
