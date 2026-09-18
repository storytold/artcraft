use std::collections::BTreeSet;

#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;
use utoipa::ToSchema;

use crate::error::enum_error::EnumError;

/// Maximum serialized string length for database storage.
pub const MAX_LENGTH: usize = 16;

/// Output video containers for generation. Unset options retain the provider default.
/// Models without output-format support ignore this option.
///
/// NB: Keep the max serialized length to 16 characters.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, PartialEq, Eq, Hash, Ord, PartialOrd, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum CommonVideoOutputFormat {
  #[serde(rename = "mp4")]
  Mp4,
  #[serde(rename = "mov")]
  Mov,
}

impl_enum_display_and_debug_using_to_str!(CommonVideoOutputFormat);
impl_mysql_enum_coders!(CommonVideoOutputFormat);
impl_mysql_from_row!(CommonVideoOutputFormat);

impl CommonVideoOutputFormat {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::Mp4 => "mp4",
      Self::Mov => "mov",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, EnumError> {
    match value {
      "mp4" => Ok(Self::Mp4),
      "mov" => Ok(Self::Mov),
      _ => Err(EnumError::CouldNotConvertFromString(value.to_string())),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    BTreeSet::from([
      Self::Mp4,
      Self::Mov,
    ])
  }
}

#[cfg(test)]
mod tests {
  use crate::common::generation::common_video_output_format::CommonVideoOutputFormat;
  use crate::common::generation::common_video_output_format::MAX_LENGTH;
  use crate::test_helpers::assert_serialization;

  mod explicit_checks {
    use super::*;
    use crate::error::enum_error::EnumError;

    #[test]
    fn test_serialization() {
      assert_serialization(CommonVideoOutputFormat::Mp4, "mp4");
      assert_serialization(CommonVideoOutputFormat::Mov, "mov");
    }

    #[test]
    fn to_str() {
      assert_eq!(CommonVideoOutputFormat::Mp4.to_str(), "mp4");
      assert_eq!(CommonVideoOutputFormat::Mov.to_str(), "mov");
    }

    #[test]
    fn from_str() {
      assert_eq!(CommonVideoOutputFormat::from_str("mp4").unwrap(), CommonVideoOutputFormat::Mp4);
      assert_eq!(CommonVideoOutputFormat::from_str("mov").unwrap(), CommonVideoOutputFormat::Mov);
    }

    #[test]
    fn from_str_err() {
      let result = CommonVideoOutputFormat::from_str("invalid");
      assert!(result.is_err());
      if let Err(EnumError::CouldNotConvertFromString(value)) = result {
        assert_eq!(value, "invalid");
      } else {
        panic!("Expected EnumError::CouldNotConvertFromString");
      }
    }

    #[test]
    fn all_variants() {
      let mut variants = CommonVideoOutputFormat::all_variants();
      assert_eq!(variants.len(), 2);
      assert_eq!(variants.pop_first(), Some(CommonVideoOutputFormat::Mp4));
      assert_eq!(variants.pop_first(), Some(CommonVideoOutputFormat::Mov));
      assert_eq!(variants.pop_first(), None);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn variant_length() {
      use strum::IntoEnumIterator;
      assert_eq!(CommonVideoOutputFormat::all_variants().len(), CommonVideoOutputFormat::iter().len());
    }

    #[test]
    fn round_trip() {
      for variant in CommonVideoOutputFormat::all_variants() {
        assert_eq!(variant, CommonVideoOutputFormat::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, CommonVideoOutputFormat::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, CommonVideoOutputFormat::from_str(&format!("{:?}", variant)).unwrap());
      }
    }

    #[test]
    fn serialized_length_ok_for_database() {
      for variant in CommonVideoOutputFormat::all_variants() {
        let serialized = variant.to_str();
        assert!(serialized.len() > 0, "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long via to_str()", variant);
      }
      for variant in CommonVideoOutputFormat::all_variants() {
        let json = serde_json::to_string(&variant).unwrap().replace('"', "");
        assert!(json.len() <= MAX_LENGTH, "variant {:?} is too long via JSON: {:?}", variant, json);
      }
    }

    #[test]
    fn serialized_names_must_not_contain_dots() {
      for variant in CommonVideoOutputFormat::all_variants() {
        let to_str_value = variant.to_str();
        assert!(!to_str_value.contains('.'), "to_str() for {:?} contains a dot: {:?}", variant, to_str_value);

        let json_value = serde_json::to_string(&variant).unwrap().replace('"', "");
        assert!(!json_value.contains('.'), "JSON serialization for {:?} contains a dot: {:?}", variant, json_value);
      }
    }

    #[test]
    fn serialized_names_must_only_contain_lowercase_alphanumeric_and_underscore() {
      let valid_pattern = regex::Regex::new(r"^[a-z0-9_]+$").unwrap();

      for variant in CommonVideoOutputFormat::all_variants() {
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
