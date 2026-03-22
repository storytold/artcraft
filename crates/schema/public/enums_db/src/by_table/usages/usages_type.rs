use strum::EnumCount;
use strum::EnumIter;

/// Used in the `usages` table in a `VARCHAR(16)` field. (Two fields!)
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[derive(Clone, Copy, Eq, PartialEq, Ord, PartialOrd, Deserialize, Serialize, EnumIter, EnumCount)]
#[serde(rename_all = "snake_case")]
pub enum UsagesType {
  /// Represents a foreign key link against a model_weights record
  ModelWeight,

  /// Represents a foreign key link against a media_files record
  MediaFile,
}

// TODO(bt, 2022-12-21): This desperately needs MySQL integration tests!
impl_enum_display_and_debug_using_to_str!(UsagesType);
impl_mysql_enum_coders!(UsagesType);
impl_mysql_from_row!(UsagesType);

/// NB: Legacy API for older code.
impl UsagesType {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::ModelWeight => "model_weight",
      Self::MediaFile => "media_file",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "model_weight" => Ok(Self::ModelWeight),
      "media_file" => Ok(Self::MediaFile),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }

}

#[cfg(test)]
mod tests {
  use super::super::usages_type::UsagesType;
  use enums_shared::test_helpers::assert_serialization;

  mod serde {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(UsagesType::ModelWeight, "model_weight");
      assert_serialization(UsagesType::MediaFile, "media_file");
    }
  }

  mod impl_methods {
    use super::*;

    #[test]
    fn to_str() {
      assert_eq!(UsagesType::ModelWeight.to_str(), "model_weight");
      assert_eq!(UsagesType::MediaFile.to_str(), "media_file");
    }

    #[test]
    fn from_str() {
      assert_eq!(UsagesType::from_str("model_weight").unwrap(), UsagesType::ModelWeight);
      assert_eq!(UsagesType::from_str("media_file").unwrap(), UsagesType::MediaFile);
      assert!(UsagesType::from_str("foo").is_err());
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip() {
      use strum::IntoEnumIterator;
      for variant in UsagesType::iter() {
        assert_eq!(variant, UsagesType::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, UsagesType::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, UsagesType::from_str(&format!("{:?}", variant)).unwrap());
      }
    }

    #[test]
    fn serialized_length_ok_for_database() {
      use strum::IntoEnumIterator;
      const MAX_LENGTH : usize = 16;
      for variant in UsagesType::iter() {
        let serialized = variant.to_str();
        assert!(serialized.len() > 0, "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long", variant);
      }
    }
  }
}
