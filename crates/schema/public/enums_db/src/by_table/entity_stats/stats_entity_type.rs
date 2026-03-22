use strum::EnumCount;
use strum::EnumIter;

/// Used in the `user_stats` table in a `VARCHAR(32)` field named `entity_type`.
#[derive(Clone, Copy, Eq, PartialEq, Hash, Deserialize, Serialize, Ord, PartialOrd, EnumIter, EnumCount)]
pub enum StatsEntityType {
    /// Comment
    #[serde(rename = "comment")]
    Comment,
    
    /// MediaFile
    #[serde(rename = "media_file")]
    MediaFile,

    /// ModelWeight (the new way to store models)
    #[serde(rename = "model_weight")]
    ModelWeight,
}

// TODO(bt, 2023-01-17): This desperately needs MySQL integration tests!
impl_enum_display_and_debug_using_to_str!(StatsEntityType);
impl_mysql_enum_coders!(StatsEntityType);
impl_mysql_from_row!(StatsEntityType);

/// NB: Legacy API for older code.
impl StatsEntityType {
    pub fn to_str(&self) -> &'static str {
        match self {
            Self::Comment => "comment",
            Self::MediaFile => "media_file",
            Self::ModelWeight => "model_weight",
        }
    }

    pub fn from_str(value: &str) -> Result<Self, String> {
        match value {
            "comment" => Ok(Self::Comment),
            "media_file" => Ok(Self::MediaFile),
            "model_weight" => Ok(Self::ModelWeight),
            _ => Err(format!("invalid value: {:?}", value)),
        }
    }

}

#[cfg(test)]
mod tests {
  use super::super::stats_entity_type::StatsEntityType;
  use enums_shared::test_helpers::assert_serialization;

  mod explicit_checks {
    use super::*;

    #[test]
        fn test_serialization() {
            assert_serialization(StatsEntityType::Comment, "comment");
            assert_serialization(StatsEntityType::MediaFile, "media_file");
            assert_serialization(StatsEntityType::ModelWeight, "model_weight");
        }

        #[test]
        fn test_to_str() {
            assert_eq!(StatsEntityType::Comment.to_str(), "comment");
            assert_eq!(StatsEntityType::MediaFile.to_str(), "media_file");
            assert_eq!(StatsEntityType::ModelWeight.to_str(), "model_weight");
        }

        #[test]
        fn test_from_str() {
            assert_eq!(StatsEntityType::from_str("comment").unwrap(), StatsEntityType::Comment);
            assert_eq!(StatsEntityType::from_str("media_file").unwrap(), StatsEntityType::MediaFile);
            assert_eq!(StatsEntityType::from_str("model_weight").unwrap(), StatsEntityType::ModelWeight);
            assert!(StatsEntityType::from_str("foo").is_err());
        }

    }

    mod mechanical_checks {
      use super::*;

        #[test]
        fn round_trip() {
          use strum::IntoEnumIterator;
            for variant in StatsEntityType::iter() {
                assert_eq!(variant, StatsEntityType::from_str(variant.to_str()).unwrap());
                assert_eq!(variant, StatsEntityType::from_str(&format!("{}", variant)).unwrap());
                assert_eq!(variant, StatsEntityType::from_str(&format!("{:?}", variant)).unwrap());
            }
        }
    
    #[test]
    fn serialized_length_ok_for_database() {
      const MAX_LENGTH: usize = 32; // TODO(bt): Confirm database column width, then remove this comment.
      use strum::IntoEnumIterator;
      for variant in StatsEntityType::iter() {
        let serialized = variant.to_str();
        assert!(!serialized.is_empty(), "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long", variant);
      }
    }
  }
}
