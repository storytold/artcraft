use std::collections::BTreeSet;

use serde::Deserialize;
use serde::Serialize;
#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `batch_generations` table in a `VARCHAR(32)` field named `entity_type`.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, Eq, PartialEq, Hash, Deserialize, Serialize, Ord, PartialOrd, ToSchema)]
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

  pub fn all_variants() -> BTreeSet<Self> {
    // NB: BTreeSet is sorted
    // NB: BTreeSet::from() isn't const, but not worth using LazyStatic, etc.
    BTreeSet::from([
      Self::MediaFile,
    ])
  }
}

#[cfg(test)]
mod tests {
  use crate::by_table::batch_generations::batch_generation_entity_type::BatchGenerationEntityType;
  use crate::test_helpers::assert_serialization;

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

  mod manual_variant_checks {
    use super::*;

    #[test]
    fn all_variants() {
      let mut variants = BatchGenerationEntityType::all_variants();
      assert_eq!(variants.len(), 1);
      assert_eq!(variants.pop_first(), Some(BatchGenerationEntityType::MediaFile));
      assert_eq!(variants.pop_first(), None);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn variant_length() {
      use strum::IntoEnumIterator;
      assert_eq!(BatchGenerationEntityType::all_variants().len(), BatchGenerationEntityType::iter().len());
    }

    #[test]
    fn round_trip() {
      for variant in BatchGenerationEntityType::all_variants() {
        assert_eq!(variant, BatchGenerationEntityType::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, BatchGenerationEntityType::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, BatchGenerationEntityType::from_str(&format!("{:?}", variant)).unwrap());
      }
    }
  }
}
