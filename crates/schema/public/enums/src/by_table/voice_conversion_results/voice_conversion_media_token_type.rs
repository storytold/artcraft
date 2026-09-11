use serde::Deserialize;
use serde::Serialize;
#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;

/// Used in the `voice_conversion_results` table in a `VARCHAR` field.
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, Eq, PartialEq, Deserialize, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum VoiceConversionMediaTokenType {
  /// Media token refers to record in `media_uploads` table.
  MediaUpload,
}

// TODO(bt, 2022-12-21): This desperately needs MySQL integration tests!
impl_enum_display_and_debug_using_to_str!(VoiceConversionMediaTokenType);
impl_mysql_enum_coders!(VoiceConversionMediaTokenType);

/// NB: Legacy API for older code.
impl VoiceConversionMediaTokenType {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::MediaUpload => "media_upload",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "media_upload" => Ok(Self::MediaUpload),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }
}

#[cfg(test)]
mod tests {
  use crate::by_table::voice_conversion_results::voice_conversion_media_token_type::VoiceConversionMediaTokenType;
  use crate::test_helpers::assert_serialization;

  #[test]
  fn test_serialization() {
    assert_serialization(VoiceConversionMediaTokenType::MediaUpload, "media_upload");
  }

  #[test]
  fn test_to_str() {
    assert_eq!(VoiceConversionMediaTokenType::MediaUpload.to_str(), "media_upload");
  }

  #[test]
  fn test_from_str() {
    assert_eq!(VoiceConversionMediaTokenType::from_str("media_upload").unwrap(), VoiceConversionMediaTokenType::MediaUpload);
    assert!(VoiceConversionMediaTokenType::from_str("foo").is_err());
  }
}
