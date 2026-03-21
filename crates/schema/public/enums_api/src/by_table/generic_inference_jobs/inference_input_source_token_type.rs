use std::collections::BTreeSet;

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

  pub fn all_variants() -> BTreeSet<InferenceInputSourceTokenType> {
    // NB: BTreeSet is sorted
    // NB: BTreeSet::from() isn't const, but not worth using LazyStatic, etc.
    BTreeSet::from([
      InferenceInputSourceTokenType::MediaFile,
      InferenceInputSourceTokenType::MediaUpload,
    ])
  }
}

#[cfg(test)]
mod tests {
  use super::InferenceInputSourceTokenType;
  use strum::IntoEnumIterator;

  #[test]
  fn round_trip_json() {
    for variant in InferenceInputSourceTokenType::iter() {
      let json = serde_json::to_string(&variant).unwrap();
      let back: InferenceInputSourceTokenType = serde_json::from_str(&json).unwrap();
      assert_eq!(variant, back);
    }
  }
}
