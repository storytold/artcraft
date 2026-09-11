use std::collections::BTreeSet;

use serde::Deserialize;
use serde::Serialize;
#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `user_stats` table in a `VARCHAR(32)` field named `entity_type`.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, Eq, PartialEq, Hash, Deserialize, Serialize, ToSchema, Ord, PartialOrd)]
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

    pub fn all_variants() -> BTreeSet<Self> {
        // NB: BTreeSet is sorted
        // NB: BTreeSet::from() isn't const, but not worth using LazyStatic, etc.
        BTreeSet::from([
            Self::Comment,
            Self::MediaFile,
            Self::ModelWeight,
        ])
    }
}

#[cfg(test)]
mod tests {
  use crate::by_table::entity_stats::stats_entity_type::StatsEntityType;
  use crate::test_helpers::assert_serialization;

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

        #[test]
        fn all_variants() {
            let mut variants = StatsEntityType::all_variants();
            assert_eq!(variants.len(), 3);
            assert_eq!(variants.pop_first(), Some(StatsEntityType::Comment));
            assert_eq!(variants.pop_first(), Some(StatsEntityType::MediaFile));
            assert_eq!(variants.pop_first(), Some(StatsEntityType::ModelWeight));
            assert_eq!(variants.pop_first(), None);
        }
    }

    mod mechanical_checks {
      use super::*;

      #[test]
        fn variant_length() {
            use strum::IntoEnumIterator;
            assert_eq!(StatsEntityType::all_variants().len(), StatsEntityType::iter().len());
        }

        #[test]
        fn round_trip() {
            for variant in StatsEntityType::all_variants() {
                assert_eq!(variant, StatsEntityType::from_str(variant.to_str()).unwrap());
                assert_eq!(variant, StatsEntityType::from_str(&format!("{}", variant)).unwrap());
                assert_eq!(variant, StatsEntityType::from_str(&format!("{:?}", variant)).unwrap());
            }
        }
    }
}
