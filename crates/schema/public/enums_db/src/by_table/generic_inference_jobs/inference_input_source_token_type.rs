use strum::EnumCount;
use strum::EnumIter;

/// Used in the `generic_inference_jobs` table in `VARCHAR(32)` field `maybe_input_source_token`.
///
/// YOU CAN ADD NEW VALUES, BUT DO NOT CHANGE EXISTING VALUES WITHOUT A MIGRATION STRATEGY.
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize, EnumIter, EnumCount)]
pub enum InferenceInputSourceTokenType {
  #[serde(rename = "media_file")]
  MediaFile,
  #[serde(rename = "media_upload")]
  MediaUpload,
}

// TODO(bt, 2022-12-21): This desperately needs MySQL integration tests!
impl_enum_display_and_debug_using_to_str!(InferenceInputSourceTokenType);
impl_mysql_enum_coders!(InferenceInputSourceTokenType);
impl_mysql_from_row!(InferenceInputSourceTokenType);

/// NB: Legacy API for older code.
impl InferenceInputSourceTokenType {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::MediaFile => "media_file",
      Self::MediaUpload => "media_upload",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "media_file" => Ok(Self::MediaFile),
      "media_upload" => Ok(Self::MediaUpload),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }

}

#[cfg(test)]
mod tests {
  use super::super::inference_input_source_token_type::InferenceInputSourceTokenType;
  use enums_shared::test_helpers::assert_serialization;

  #[test]
  fn test_serialization() {
    assert_serialization(InferenceInputSourceTokenType::MediaFile, "media_file");
    assert_serialization(InferenceInputSourceTokenType::MediaUpload, "media_upload");
  }

  #[test]
  fn to_str() {
    assert_eq!(InferenceInputSourceTokenType::MediaFile.to_str(), "media_file");
    assert_eq!(InferenceInputSourceTokenType::MediaUpload.to_str(), "media_upload");
  }

  #[test]
  fn from_str() {
    assert_eq!(InferenceInputSourceTokenType::from_str("media_file").unwrap(), InferenceInputSourceTokenType::MediaFile);
    assert_eq!(InferenceInputSourceTokenType::from_str("media_upload").unwrap(), InferenceInputSourceTokenType::MediaUpload);
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip() {
      use strum::IntoEnumIterator;
      for variant in InferenceInputSourceTokenType::iter() {
        assert_eq!(variant, InferenceInputSourceTokenType::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, InferenceInputSourceTokenType::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, InferenceInputSourceTokenType::from_str(&format!("{:?}", variant)).unwrap());
      }
    }

    #[test]
    fn serialized_length_ok_for_database() {
      const MAX_LENGTH: usize = 32; // TODO(bt): Confirm database column width, then remove this comment.
      use strum::IntoEnumIterator;
      for variant in InferenceInputSourceTokenType::iter() {
        let serialized = variant.to_str();
        assert!(!serialized.is_empty(), "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long", variant);
      }
    }
  }
}
