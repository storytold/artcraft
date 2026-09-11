use std::collections::BTreeSet;

#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;

/// Used in the `generic_inference_jobs` table in `VARCHAR(32)` field `maybe_input_source_token`.
///
/// YOU CAN ADD NEW VALUES, BUT DO NOT CHANGE EXISTING VALUES WITHOUT A MIGRATION STRATEGY.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize)]
pub enum InferenceInputSourceTokenType {
  #[serde(rename = "media_file")]
  MediaFile,
  #[serde(rename = "media_upload")]
  MediaUpload,
}

// TODO(bt, 2022-12-21): This desperately needs MySQL integration tests!
impl_enum_display_and_debug_using_to_str!(InferenceInputSourceTokenType);
impl_mysql_enum_coders!(InferenceInputSourceTokenType);

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
  use crate::by_table::generic_inference_jobs::inference_input_source_token_type::InferenceInputSourceTokenType;
  use crate::test_helpers::assert_serialization;

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

  #[test]
  fn all_variants() {
    // Static check
    let mut variants = InferenceInputSourceTokenType::all_variants();
    assert_eq!(variants.len(), 2);
    assert_eq!(variants.pop_first(), Some(InferenceInputSourceTokenType::MediaFile));
    assert_eq!(variants.pop_first(), Some(InferenceInputSourceTokenType::MediaUpload));
    assert_eq!(variants.pop_first(), None);

    // Generated check
    use strum::IntoEnumIterator;
    assert_eq!(InferenceInputSourceTokenType::all_variants().len(), InferenceInputSourceTokenType::iter().len());
  }
}
