use strum::EnumCount;
use strum::EnumIter;

/// Used in the `tag_uses` table in a `VARCHAR(32)` field named `entity_type`.
#[derive(Clone, Copy, Eq, PartialEq, Ord, PartialOrd, Hash, Deserialize, Serialize, EnumIter, EnumCount)]
pub enum TagUseEntityType {
  /// Media files
  #[serde(rename = "media_file")]
  MediaFile,

  /// Model weights
  #[serde(rename = "model_weight")]
  ModelWeight,
}

// TODO(bt, 2023-01-17): This desperately needs MySQL integration tests!
impl_enum_display_and_debug_using_to_str!(TagUseEntityType);
impl_mysql_enum_coders!(TagUseEntityType);
impl_mysql_from_row!(TagUseEntityType);

/// NB: Legacy API for older code.
impl TagUseEntityType {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::MediaFile => "media_file",
      Self::ModelWeight => "model_weight",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "media_file" => Ok(Self::MediaFile),
      "model_weight" => Ok(Self::ModelWeight),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }
  
}

#[cfg(test)]
mod tests {
  use enums_shared::test_helpers::assert_serialization;
  use super::super::tag_use_entity_type::TagUseEntityType;

  mod serde {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(TagUseEntityType::MediaFile, "media_file");
      assert_serialization(TagUseEntityType::ModelWeight, "model_weight");
    }
  }

  mod impl_methods {
    use super::*;

    #[test]
    fn test_to_str() {
      assert_eq!(TagUseEntityType::MediaFile.to_str(), "media_file");
      assert_eq!(TagUseEntityType::ModelWeight.to_str(), "model_weight");
    }

    #[test]
    fn test_from_str() {
      assert_eq!(TagUseEntityType::from_str("media_file").unwrap(), TagUseEntityType::MediaFile);
      assert_eq!(TagUseEntityType::from_str("model_weight").unwrap(), TagUseEntityType::ModelWeight);
      assert!(TagUseEntityType::from_str("foo").is_err());
    }
  }
  
  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip() {
      use strum::IntoEnumIterator;
      for variant in TagUseEntityType::iter() {
        assert_eq!(variant, TagUseEntityType::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, TagUseEntityType::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, TagUseEntityType::from_str(&format!("{:?}", variant)).unwrap());
      }
    }

    #[test]
    fn serialized_length_ok_for_database() {
      use strum::IntoEnumIterator;
      const MAX_LENGTH : usize = 32;
      for variant in TagUseEntityType::iter() {
        let serialized = variant.to_str();
        assert!(serialized.len() > 0, "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long", variant);
      }
    }
  }
}
