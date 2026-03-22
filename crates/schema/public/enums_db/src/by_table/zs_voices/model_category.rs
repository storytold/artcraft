use strum::EnumCount;
use strum::EnumIter;

/// Used in the `zs_voices` table in a `VARCHAR(16)` field named `model_category`.
///
/// This indicates what type of features are used in the embeddings.
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize, EnumIter, EnumCount)]
pub enum ZsVoiceModelCategory {
  /// TTS-type zero shot models
  #[serde(rename = "tts")]
  Tts,
}

// TODO(bt, 2023-01-17): This desperately needs MySQL integration tests!
impl_enum_display_and_debug_using_to_str!(ZsVoiceModelCategory);
impl_mysql_enum_coders!(ZsVoiceModelCategory);
impl_mysql_from_row!(ZsVoiceModelCategory);

/// NB: Legacy API for older code.
impl ZsVoiceModelCategory {
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
  use super::super::model_category::ZsVoiceModelCategory;
  use enums_shared::test_helpers::assert_serialization;

  mod serde {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(ZsVoiceModelCategory::Tts, "tts");
    }
  }

  mod impl_methods {
    use super::*;

    #[test]
    fn to_str() {
      assert_eq!(ZsVoiceModelCategory::Tts.to_str(), "tts");
    }

    #[test]
    fn from_str() {
      assert_eq!(ZsVoiceModelCategory::from_str("tts").unwrap(), ZsVoiceModelCategory::Tts);
      assert!(ZsVoiceModelCategory::from_str("foo").is_err());
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip() {
      use strum::IntoEnumIterator;
      for variant in ZsVoiceModelCategory::iter() {
        assert_eq!(variant, ZsVoiceModelCategory::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, ZsVoiceModelCategory::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, ZsVoiceModelCategory::from_str(&format!("{:?}", variant)).unwrap());
      }
    }
  
    #[test]
    fn serialized_length_ok_for_database() {
      const MAX_LENGTH: usize = 16; // TODO(bt): Confirm database column width, then remove this comment.
      use strum::IntoEnumIterator;
      for variant in ZsVoiceModelCategory::iter() {
        let serialized = variant.to_str();
        assert!(!serialized.is_empty(), "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long", variant);
      }
    }
  }
}
