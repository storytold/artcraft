use strum::EnumCount;
use strum::EnumIter;

/// Used in the `batch_generations` table in a `VARCHAR(32)` field named `entity_type`.
#[derive(Clone, Copy, Eq, PartialEq, Hash, Deserialize, Serialize, Ord, PartialOrd, EnumIter, EnumCount)]
pub enum BatchGenerationEntityType {
  /// Media files
  /// This will probably be the only type supported, but we'll leave the possibility of future types.
  #[serde(rename = "media_file")]
  MediaFile,
}

// TODO(bt, 2023-01-17): This desperately needs MySQL integration tests!
impl_enum_display_and_debug_using_to_str!(BatchGenerationEntityType);
impl_mysql_enum_coders!(BatchGenerationEntityType);
impl_mysql_from_row!(BatchGenerationEntityType);

/// NB: Legacy API for older code.
impl BatchGenerationEntityType {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::MediaFile => "media_file",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "media_file" => Ok(Self::MediaFile),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }

}

#[cfg(test)]
mod tests {
  use super::super::batch_generation_entity_type::BatchGenerationEntityType;
  use enums_shared::test_helpers::assert_serialization;

  mod serde {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(BatchGenerationEntityType::MediaFile, "media_file");
    }
  }

  mod impl_methods {
    use super::*;

    #[test]
    fn to_str() {
      assert_eq!(BatchGenerationEntityType::MediaFile.to_str(), "media_file");
    }

    #[test]
    fn from_str() {
      assert_eq!(BatchGenerationEntityType::from_str("media_file").unwrap(), BatchGenerationEntityType::MediaFile);
      assert!(BatchGenerationEntityType::from_str("foo").is_err());
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip() {
      use strum::IntoEnumIterator;
      for variant in BatchGenerationEntityType::iter() {
        assert_eq!(variant, BatchGenerationEntityType::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, BatchGenerationEntityType::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, BatchGenerationEntityType::from_str(&format!("{:?}", variant)).unwrap());
      }
    }
  
    #[test]
    fn serialized_length_ok_for_database() {
      const MAX_LENGTH: usize = 32; // TODO(bt): Confirm database column width, then remove this comment.
      use strum::IntoEnumIterator;
      for variant in BatchGenerationEntityType::iter() {
        let serialized = variant.to_str();
        assert!(!serialized.is_empty(), "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long", variant);
      }
    }
  }
}
