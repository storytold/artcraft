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
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

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
