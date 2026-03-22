use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `generic_inference_jobs` table in `VARCHAR(32)` field `maybe_input_source_token`.
///
/// YOU CAN ADD NEW VALUES, BUT DO NOT CHANGE EXISTING VALUES WITHOUT A MIGRATION STRATEGY.
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize, ToSchema, EnumIter, Debug)]

pub enum InferenceInputSourceTokenType {
  #[serde(rename = "media_file")]
  MediaFile,
  #[serde(rename = "media_upload")]
  MediaUpload,
}

#[cfg(test)]
mod tests {
  use super::InferenceInputSourceTokenType;
  use enums_shared::test_helpers::{assert_deserialization, assert_serialization};
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(InferenceInputSourceTokenType::MediaFile, "media_file");
      assert_serialization(InferenceInputSourceTokenType::MediaUpload, "media_upload");
    }

    #[test]
    fn test_deserialization() {
      assert_deserialization("media_file", InferenceInputSourceTokenType::MediaFile);
      assert_deserialization("media_upload", InferenceInputSourceTokenType::MediaUpload);
    }

    #[test]
    fn variants_count_check() {
      assert_eq!(InferenceInputSourceTokenType::iter().count(), 2);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in InferenceInputSourceTokenType::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: InferenceInputSourceTokenType = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
