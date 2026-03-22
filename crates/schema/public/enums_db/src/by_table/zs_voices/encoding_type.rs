use strum::EnumCount;
use strum::EnumIter;

/// Used in the `zs_voices` table in a `VARCHAR(16)` field named `encoding_type`.
///
/// This indicates what type of features are used in the embeddings.
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize, EnumIter, EnumCount)]
pub enum ZsVoiceEncodingType {
  /// Encodec features
  #[serde(rename = "encodec")]
  Encodec,
}

// TODO(bt, 2023-01-17): This desperately needs MySQL integration tests!
impl_enum_display_and_debug_using_to_str!(ZsVoiceEncodingType);
impl_mysql_enum_coders!(ZsVoiceEncodingType);
impl_mysql_from_row!(ZsVoiceEncodingType);

/// NB: Legacy API for older code.
impl ZsVoiceEncodingType {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::Encodec => "encodec",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "encodec" => Ok(Self::Encodec),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }

}

#[cfg(test)]
mod tests {
  use super::super::encoding_type::ZsVoiceEncodingType;
  use enums_shared::test_helpers::assert_serialization;

  mod serde {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(ZsVoiceEncodingType::Encodec, "encodec");
    }
  }

  mod impl_methods {
    use super::*;

    #[test]
    fn to_str() {
      assert_eq!(ZsVoiceEncodingType::Encodec.to_str(), "encodec");
    }

    #[test]
    fn from_str() {
      assert_eq!(ZsVoiceEncodingType::from_str("encodec").unwrap(), ZsVoiceEncodingType::Encodec);
      assert!(ZsVoiceEncodingType::from_str("foo").is_err());
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip() {
      use strum::IntoEnumIterator;
      for variant in ZsVoiceEncodingType::iter() {
        assert_eq!(variant, ZsVoiceEncodingType::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, ZsVoiceEncodingType::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, ZsVoiceEncodingType::from_str(&format!("{:?}", variant)).unwrap());
      }
    }
  
    #[test]
    fn serialized_length_ok_for_database() {
      const MAX_LENGTH: usize = 16; // TODO(bt): Confirm database column width, then remove this comment.
      use strum::IntoEnumIterator;
      for variant in ZsVoiceEncodingType::iter() {
        let serialized = variant.to_str();
        assert!(!serialized.is_empty(), "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long", variant);
      }
    }
  }
}
