use std::collections::BTreeSet;

#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;
use utoipa::ToSchema;

use crate::error::enum_error::EnumError;

/// Maximum serialized string length for database storage.
pub const MAX_LENGTH: usize = 16;

/// Common resolutions for generation.
///
/// NB: Keep the max serialized length to 16 characters.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, PartialEq, Eq, Hash, Ord, PartialOrd, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum CommonResolution {
  OneK,
  TwoK,
  ThreeK,
  FourK,

  // TODO: Add 480p(?), 720p(?), 1080p, etc. as there are some models that use these
}

impl_enum_display_and_debug_using_to_str!(CommonResolution);
impl_mysql_enum_coders!(CommonResolution);
impl_mysql_from_row!(CommonResolution);

impl CommonResolution {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::OneK => "one_k",
      Self::TwoK => "two_k",
      Self::ThreeK => "three_k",
      Self::FourK => "four_k",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, EnumError> {
    match value {
      "one_k" => Ok(Self::OneK),
      "two_k" => Ok(Self::TwoK),
      "three_k" => Ok(Self::ThreeK),
      "four_k" => Ok(Self::FourK),
      _ => Err(EnumError::CouldNotConvertFromString(value.to_string())),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    BTreeSet::from([
      Self::OneK,
      Self::TwoK,
      Self::ThreeK,
      Self::FourK,
    ])
  }
}

#[cfg(test)]
mod tests {
  use crate::common::generation::common_resolution::CommonResolution;
  use crate::common::generation::common_resolution::MAX_LENGTH;
  use crate::test_helpers::assert_serialization;

  mod explicit_checks {
    use super::*;
    use crate::error::enum_error::EnumError;

    #[test]
    fn test_serialization() {
      assert_serialization(CommonResolution::OneK, "one_k");
      assert_serialization(CommonResolution::TwoK, "two_k");
      assert_serialization(CommonResolution::ThreeK, "three_k");
      assert_serialization(CommonResolution::FourK, "four_k");
    }

    #[test]
    fn to_str() {
      assert_eq!(CommonResolution::OneK.to_str(), "one_k");
      assert_eq!(CommonResolution::TwoK.to_str(), "two_k");
      assert_eq!(CommonResolution::ThreeK.to_str(), "three_k");
      assert_eq!(CommonResolution::FourK.to_str(), "four_k");
    }

    #[test]
    fn from_str() {
      assert_eq!(CommonResolution::from_str("one_k").unwrap(), CommonResolution::OneK);
      assert_eq!(CommonResolution::from_str("two_k").unwrap(), CommonResolution::TwoK);
      assert_eq!(CommonResolution::from_str("three_k").unwrap(), CommonResolution::ThreeK);
      assert_eq!(CommonResolution::from_str("four_k").unwrap(), CommonResolution::FourK);
    }

    #[test]
    fn from_str_err() {
      let result = CommonResolution::from_str("invalid");
      assert!(result.is_err());
      if let Err(EnumError::CouldNotConvertFromString(value)) = result {
        assert_eq!(value, "invalid");
      } else {
        panic!("Expected EnumError::CouldNotConvertFromString");
      }
    }

    #[test]
    fn all_variants() {
      let mut variants = CommonResolution::all_variants();
      assert_eq!(variants.len(), 4);
      assert_eq!(variants.pop_first(), Some(CommonResolution::OneK));
      assert_eq!(variants.pop_first(), Some(CommonResolution::TwoK));
      assert_eq!(variants.pop_first(), Some(CommonResolution::ThreeK));
      assert_eq!(variants.pop_first(), Some(CommonResolution::FourK));
      assert_eq!(variants.pop_first(), None);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn variant_length() {
      use strum::IntoEnumIterator;
      assert_eq!(CommonResolution::all_variants().len(), CommonResolution::iter().len());
    }

    #[test]
    fn round_trip() {
      for variant in CommonResolution::all_variants() {
        assert_eq!(variant, CommonResolution::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, CommonResolution::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, CommonResolution::from_str(&format!("{:?}", variant)).unwrap());
      }
    }

    #[test]
    fn serialized_length_ok_for_database() {
      for variant in CommonResolution::all_variants() {
        let serialized = variant.to_str();
        assert!(serialized.len() > 0, "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long via to_str()", variant);
      }
      for variant in CommonResolution::all_variants() {
        let json = serde_json::to_string(&variant).unwrap().replace('"', "");
        assert!(json.len() <= MAX_LENGTH, "variant {:?} is too long via JSON: {:?}", variant, json);
      }
    }

    #[test]
    fn serialized_names_must_not_contain_dots() {
      for variant in CommonResolution::all_variants() {
        let to_str_value = variant.to_str();
        assert!(!to_str_value.contains('.'), "to_str() for {:?} contains a dot: {:?}", variant, to_str_value);

        let json_value = serde_json::to_string(&variant).unwrap().replace('"', "");
        assert!(!json_value.contains('.'), "JSON serialization for {:?} contains a dot: {:?}", variant, json_value);
      }
    }

    #[test]
    fn serialized_names_must_only_contain_lowercase_alphanumeric_and_underscore() {
      let valid_pattern = regex::Regex::new(r"^[a-z0-9_]+$").unwrap();

      for variant in CommonResolution::all_variants() {
        let to_str_value = variant.to_str();
        assert!(valid_pattern.is_match(to_str_value),
          "to_str() for {:?} contains invalid characters: {:?} (only a-z, 0-9, _ allowed)", variant, to_str_value);

        let json_value = serde_json::to_string(&variant).unwrap().replace('"', "");
        assert!(valid_pattern.is_match(&json_value),
          "JSON serialization for {:?} contains invalid characters: {:?} (only a-z, 0-9, _ allowed)", variant, json_value);
      }
    }
  }
}
