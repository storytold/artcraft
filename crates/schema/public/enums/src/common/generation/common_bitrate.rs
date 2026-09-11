use std::collections::BTreeSet;

#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;
use utoipa::ToSchema;

use crate::error::enum_error::EnumError;

/// Maximum serialized string length for database storage.
pub const MAX_LENGTH: usize = 16;

/// Common output bitrate levels for generation.
///
/// Most models default to `Normal`; `High` requests a higher bitrate where the
/// model supports it. Models that don't support it simply ignore the value.
///
/// NB: Keep the max serialized length to 16 characters.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, PartialEq, Eq, Hash, Ord, PartialOrd, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum CommonBitrate {
  Normal,
  High,
}

impl_enum_display_and_debug_using_to_str!(CommonBitrate);
impl_mysql_enum_coders!(CommonBitrate);
impl_mysql_from_row!(CommonBitrate);

impl CommonBitrate {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::Normal => "normal",
      Self::High => "high",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, EnumError> {
    match value {
      "normal" => Ok(Self::Normal),
      "high" => Ok(Self::High),
      _ => Err(EnumError::CouldNotConvertFromString(value.to_string())),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    BTreeSet::from([
      Self::Normal,
      Self::High,
    ])
  }
}

#[cfg(test)]
mod tests {
  use crate::common::generation::common_bitrate::CommonBitrate;
  use crate::common::generation::common_bitrate::MAX_LENGTH;
  use crate::test_helpers::assert_serialization;

  mod explicit_checks {
    use super::*;
    use crate::error::enum_error::EnumError;

    #[test]
    fn test_serialization() {
      assert_serialization(CommonBitrate::Normal, "normal");
      assert_serialization(CommonBitrate::High, "high");
    }

    #[test]
    fn to_str() {
      assert_eq!(CommonBitrate::Normal.to_str(), "normal");
      assert_eq!(CommonBitrate::High.to_str(), "high");
    }

    #[test]
    fn from_str() {
      assert_eq!(CommonBitrate::from_str("normal").unwrap(), CommonBitrate::Normal);
      assert_eq!(CommonBitrate::from_str("high").unwrap(), CommonBitrate::High);
    }

    #[test]
    fn from_str_err() {
      let result = CommonBitrate::from_str("invalid");
      assert!(result.is_err());
      if let Err(EnumError::CouldNotConvertFromString(value)) = result {
        assert_eq!(value, "invalid");
      } else {
        panic!("Expected EnumError::CouldNotConvertFromString");
      }
    }

    #[test]
    fn all_variants() {
      let mut variants = CommonBitrate::all_variants();
      assert_eq!(variants.len(), 2);
      assert_eq!(variants.pop_first(), Some(CommonBitrate::Normal));
      assert_eq!(variants.pop_first(), Some(CommonBitrate::High));
      assert_eq!(variants.pop_first(), None);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn variant_length() {
      use strum::IntoEnumIterator;
      assert_eq!(CommonBitrate::all_variants().len(), CommonBitrate::iter().len());
    }

    #[test]
    fn round_trip() {
      for variant in CommonBitrate::all_variants() {
        assert_eq!(variant, CommonBitrate::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, CommonBitrate::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, CommonBitrate::from_str(&format!("{:?}", variant)).unwrap());
      }
    }

    #[test]
    fn serialized_length_ok_for_database() {
      for variant in CommonBitrate::all_variants() {
        let serialized = variant.to_str();
        assert!(serialized.len() > 0, "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long via to_str()", variant);
      }
      for variant in CommonBitrate::all_variants() {
        let json = serde_json::to_string(&variant).unwrap().replace('"', "");
        assert!(json.len() <= MAX_LENGTH, "variant {:?} is too long via JSON: {:?}", variant, json);
      }
    }

    #[test]
    fn serialized_names_must_not_contain_dots() {
      for variant in CommonBitrate::all_variants() {
        let to_str_value = variant.to_str();
        assert!(!to_str_value.contains('.'), "to_str() for {:?} contains a dot: {:?}", variant, to_str_value);

        let json_value = serde_json::to_string(&variant).unwrap().replace('"', "");
        assert!(!json_value.contains('.'), "JSON serialization for {:?} contains a dot: {:?}", variant, json_value);
      }
    }

    #[test]
    fn serialized_names_must_only_contain_lowercase_alphanumeric_and_underscore() {
      let valid_pattern = regex::Regex::new(r"^[a-z0-9_]+$").unwrap();

      for variant in CommonBitrate::all_variants() {
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
