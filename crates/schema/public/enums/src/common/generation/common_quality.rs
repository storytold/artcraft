use std::collections::BTreeSet;

#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;
use utoipa::ToSchema;

use crate::error::enum_error::EnumError;

/// Maximum serialized string length for database storage.
pub const MAX_LENGTH: usize = 16;

/// Common quality levels for generation.
///
/// Declared from "let the model decide" through the highest tier down to the lowest, so the
/// derived `Ord` (and `all_variants()`) reads top-down. Not every model supports every tier;
/// the router clamps unsupported tiers to the nearest one the model offers.
///
/// NB: Keep the max serialized length to 16 characters.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, PartialEq, Eq, Hash, Ord, PartialOrd, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum CommonQuality {
  /// Let the model choose. Models without a native "auto" treat this as their default tier.
  Auto,
  /// Highest tier (GPT Image 2.5 `max`).
  Max,
  /// Between High and Max (GPT Image 2.5 `xhigh`).
  #[serde(rename = "xhigh")]
  XHigh,
  High,
  Medium,
  Low,
}

impl_enum_display_and_debug_using_to_str!(CommonQuality);
impl_mysql_enum_coders!(CommonQuality);
impl_mysql_from_row!(CommonQuality);

impl CommonQuality {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::Auto => "auto",
      Self::Max => "max",
      Self::XHigh => "xhigh",
      Self::High => "high",
      Self::Medium => "medium",
      Self::Low => "low",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, EnumError> {
    match value {
      "auto" => Ok(Self::Auto),
      "max" => Ok(Self::Max),
      "xhigh" => Ok(Self::XHigh),
      "high" => Ok(Self::High),
      "medium" => Ok(Self::Medium),
      "low" => Ok(Self::Low),
      _ => Err(EnumError::CouldNotConvertFromString(value.to_string())),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    BTreeSet::from([
      Self::Auto,
      Self::Max,
      Self::XHigh,
      Self::High,
      Self::Medium,
      Self::Low,
    ])
  }
}

#[cfg(test)]
mod tests {
  use crate::common::generation::common_quality::CommonQuality;
  use crate::common::generation::common_quality::MAX_LENGTH;
  use crate::test_helpers::assert_serialization;

  mod explicit_checks {
    use super::*;
    use crate::error::enum_error::EnumError;

    #[test]
    fn test_serialization() {
      assert_serialization(CommonQuality::Auto, "auto");
      assert_serialization(CommonQuality::Max, "max");
      assert_serialization(CommonQuality::XHigh, "xhigh");
      assert_serialization(CommonQuality::High, "high");
      assert_serialization(CommonQuality::Medium, "medium");
      assert_serialization(CommonQuality::Low, "low");
    }

    #[test]
    fn to_str() {
      assert_eq!(CommonQuality::Auto.to_str(), "auto");
      assert_eq!(CommonQuality::Max.to_str(), "max");
      assert_eq!(CommonQuality::XHigh.to_str(), "xhigh");
      assert_eq!(CommonQuality::High.to_str(), "high");
      assert_eq!(CommonQuality::Medium.to_str(), "medium");
      assert_eq!(CommonQuality::Low.to_str(), "low");
    }

    #[test]
    fn from_str() {
      assert_eq!(CommonQuality::from_str("auto").unwrap(), CommonQuality::Auto);
      assert_eq!(CommonQuality::from_str("max").unwrap(), CommonQuality::Max);
      assert_eq!(CommonQuality::from_str("xhigh").unwrap(), CommonQuality::XHigh);
      assert_eq!(CommonQuality::from_str("high").unwrap(), CommonQuality::High);
      assert_eq!(CommonQuality::from_str("medium").unwrap(), CommonQuality::Medium);
      assert_eq!(CommonQuality::from_str("low").unwrap(), CommonQuality::Low);
    }

    #[test]
    fn from_str_err() {
      let result = CommonQuality::from_str("invalid");
      assert!(result.is_err());
      if let Err(EnumError::CouldNotConvertFromString(value)) = result {
        assert_eq!(value, "invalid");
      } else {
        panic!("Expected EnumError::CouldNotConvertFromString");
      }
    }

    #[test]
    fn all_variants() {
      let mut variants = CommonQuality::all_variants();
      assert_eq!(variants.len(), 6);
      assert_eq!(variants.pop_first(), Some(CommonQuality::Auto));
      assert_eq!(variants.pop_first(), Some(CommonQuality::Max));
      assert_eq!(variants.pop_first(), Some(CommonQuality::XHigh));
      assert_eq!(variants.pop_first(), Some(CommonQuality::High));
      assert_eq!(variants.pop_first(), Some(CommonQuality::Medium));
      assert_eq!(variants.pop_first(), Some(CommonQuality::Low));
      assert_eq!(variants.pop_first(), None);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn variant_length() {
      use strum::IntoEnumIterator;
      assert_eq!(CommonQuality::all_variants().len(), CommonQuality::iter().len());
    }

    #[test]
    fn round_trip() {
      for variant in CommonQuality::all_variants() {
        assert_eq!(variant, CommonQuality::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, CommonQuality::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, CommonQuality::from_str(&format!("{:?}", variant)).unwrap());
      }
    }

    #[test]
    fn serialized_length_ok_for_database() {
      for variant in CommonQuality::all_variants() {
        let serialized = variant.to_str();
        assert!(serialized.len() > 0, "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long via to_str()", variant);
      }
      for variant in CommonQuality::all_variants() {
        let json = serde_json::to_string(&variant).unwrap().replace('"', "");
        assert!(json.len() <= MAX_LENGTH, "variant {:?} is too long via JSON: {:?}", variant, json);
      }
    }

    #[test]
    fn serialized_names_must_not_contain_dots() {
      for variant in CommonQuality::all_variants() {
        let to_str_value = variant.to_str();
        assert!(!to_str_value.contains('.'), "to_str() for {:?} contains a dot: {:?}", variant, to_str_value);

        let json_value = serde_json::to_string(&variant).unwrap().replace('"', "");
        assert!(!json_value.contains('.'), "JSON serialization for {:?} contains a dot: {:?}", variant, json_value);
      }
    }

    #[test]
    fn serialized_names_must_only_contain_lowercase_alphanumeric_and_underscore() {
      let valid_pattern = regex::Regex::new(r"^[a-z0-9_]+$").unwrap();

      for variant in CommonQuality::all_variants() {
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
