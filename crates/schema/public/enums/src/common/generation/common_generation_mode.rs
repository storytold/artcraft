use std::collections::BTreeSet;

#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;
use utoipa::ToSchema;

use crate::error::enum_error::EnumError;

/// Maximum serialized string length for database storage.
/// Stored in the `prompts` table (`maybe_generation_mode` column) as VARCHAR(24).
pub const MAX_LENGTH: usize = 24;

/// The generation mode describes how the user wants to generate content.
///
/// Stored in the `prompts` table (`maybe_generation_mode` column).
///
/// NB: Keep the max serialized length to 24 characters.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, PartialEq, Eq, Hash, Ord, PartialOrd, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum CommonGenerationMode {
  /// Generate from a keyframe (eg. image-to-video with a start/end frame)
  Keyframe,

  /// Generate using a reference image or style
  Reference,

  /// Edit an existing image or video
  Edit,

  /// Inpaint a masked region of an image
  Inpaint,

  /// Outpaint / extend beyond the borders of an image
  Outpaint,

  /// Generate from a text prompt only (no image input)
  Text,
}

impl_enum_display_and_debug_using_to_str!(CommonGenerationMode);
impl_mysql_enum_coders!(CommonGenerationMode);
impl_mysql_from_row!(CommonGenerationMode);

impl CommonGenerationMode {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::Keyframe => "keyframe",
      Self::Reference => "reference",
      Self::Edit => "edit",
      Self::Inpaint => "inpaint",
      Self::Outpaint => "outpaint",
      Self::Text => "text",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, EnumError> {
    match value {
      "keyframe" => Ok(Self::Keyframe),
      "reference" => Ok(Self::Reference),
      "edit" => Ok(Self::Edit),
      "inpaint" => Ok(Self::Inpaint),
      "outpaint" => Ok(Self::Outpaint),
      "text" => Ok(Self::Text),
      _ => Err(EnumError::CouldNotConvertFromString(value.to_string())),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    BTreeSet::from([
      Self::Keyframe,
      Self::Reference,
      Self::Edit,
      Self::Inpaint,
      Self::Outpaint,
      Self::Text,
    ])
  }
}

#[cfg(test)]
mod tests {
  use crate::common::generation::common_generation_mode::CommonGenerationMode;
  use crate::common::generation::common_generation_mode::MAX_LENGTH;
  use crate::test_helpers::assert_serialization;

  mod explicit_checks {
    use super::*;
    use crate::error::enum_error::EnumError;

    #[test]
    fn test_serialization() {
      assert_serialization(CommonGenerationMode::Keyframe, "keyframe");
      assert_serialization(CommonGenerationMode::Reference, "reference");
      assert_serialization(CommonGenerationMode::Edit, "edit");
      assert_serialization(CommonGenerationMode::Inpaint, "inpaint");
      assert_serialization(CommonGenerationMode::Outpaint, "outpaint");
      assert_serialization(CommonGenerationMode::Text, "text");
    }

    #[test]
    fn to_str() {
      assert_eq!(CommonGenerationMode::Keyframe.to_str(), "keyframe");
      assert_eq!(CommonGenerationMode::Reference.to_str(), "reference");
      assert_eq!(CommonGenerationMode::Edit.to_str(), "edit");
      assert_eq!(CommonGenerationMode::Inpaint.to_str(), "inpaint");
      assert_eq!(CommonGenerationMode::Outpaint.to_str(), "outpaint");
      assert_eq!(CommonGenerationMode::Text.to_str(), "text");
    }

    #[test]
    fn from_str() {
      assert_eq!(CommonGenerationMode::from_str("keyframe").unwrap(), CommonGenerationMode::Keyframe);
      assert_eq!(CommonGenerationMode::from_str("reference").unwrap(), CommonGenerationMode::Reference);
      assert_eq!(CommonGenerationMode::from_str("edit").unwrap(), CommonGenerationMode::Edit);
      assert_eq!(CommonGenerationMode::from_str("inpaint").unwrap(), CommonGenerationMode::Inpaint);
      assert_eq!(CommonGenerationMode::from_str("outpaint").unwrap(), CommonGenerationMode::Outpaint);
      assert_eq!(CommonGenerationMode::from_str("text").unwrap(), CommonGenerationMode::Text);
    }

    #[test]
    fn from_str_err() {
      let result = CommonGenerationMode::from_str("invalid");
      assert!(result.is_err());
      if let Err(EnumError::CouldNotConvertFromString(value)) = result {
        assert_eq!(value, "invalid");
      } else {
        panic!("Expected EnumError::CouldNotConvertFromString");
      }
    }

    #[test]
    fn all_variants() {
      let mut variants = CommonGenerationMode::all_variants();
      assert_eq!(variants.len(), 6);
      assert_eq!(variants.pop_first(), Some(CommonGenerationMode::Keyframe));
      assert_eq!(variants.pop_first(), Some(CommonGenerationMode::Reference));
      assert_eq!(variants.pop_first(), Some(CommonGenerationMode::Edit));
      assert_eq!(variants.pop_first(), Some(CommonGenerationMode::Inpaint));
      assert_eq!(variants.pop_first(), Some(CommonGenerationMode::Outpaint));
      assert_eq!(variants.pop_first(), Some(CommonGenerationMode::Text));
      assert_eq!(variants.pop_first(), None);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn variant_length() {
      use strum::IntoEnumIterator;
      assert_eq!(CommonGenerationMode::all_variants().len(), CommonGenerationMode::iter().len());
    }

    #[test]
    fn round_trip() {
      for variant in CommonGenerationMode::all_variants() {
        assert_eq!(variant, CommonGenerationMode::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, CommonGenerationMode::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, CommonGenerationMode::from_str(&format!("{:?}", variant)).unwrap());
      }
    }

    #[test]
    fn serialized_length_ok_for_database() {
      for variant in CommonGenerationMode::all_variants() {
        let serialized = variant.to_str();
        assert!(serialized.len() > 0, "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long via to_str()", variant);
      }
      for variant in CommonGenerationMode::all_variants() {
        let json = serde_json::to_string(&variant).unwrap().replace('"', "");
        assert!(json.len() <= MAX_LENGTH, "variant {:?} is too long via JSON: {:?}", variant, json);
      }
    }

    #[test]
    fn serialized_names_must_not_contain_dots() {
      for variant in CommonGenerationMode::all_variants() {
        let to_str_value = variant.to_str();
        assert!(!to_str_value.contains('.'), "to_str() for {:?} contains a dot: {:?}", variant, to_str_value);

        let json_value = serde_json::to_string(&variant).unwrap().replace('"', "");
        assert!(!json_value.contains('.'), "JSON serialization for {:?} contains a dot: {:?}", variant, json_value);
      }
    }

    #[test]
    fn serialized_names_must_only_contain_lowercase_alphanumeric_and_underscore() {
      let valid_pattern = regex::Regex::new(r"^[a-z0-9_]+$").unwrap();

      for variant in CommonGenerationMode::all_variants() {
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
