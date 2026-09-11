use serde::Deserialize;
use serde::Serialize;
#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;

/// Used in the `media_uploads` table in a `VARCHAR` field.
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, Eq, PartialEq, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum MediaUploadType {
  /// Audio files: wav, mp3, etc.
  Audio,

  /// Image files: png, jpeg, etc.
  Image,

  /// Video files: mp4, etc.
  Video,

  // Binary files: safetensors ... weights, etc.
  Binary,
}

// TODO(bt, 2022-12-21): This desperately needs MySQL integration tests!
impl_enum_display_and_debug_using_to_str!(MediaUploadType);
impl_mysql_enum_coders!(MediaUploadType);

/// NB: Legacy API for older code.
impl MediaUploadType {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::Audio => "audio",
      Self::Image => "image",
      Self::Video => "video",
      Self::Binary => "binary",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "audio" => Ok(Self::Audio),
      "image" => Ok(Self::Image),
      "video" => Ok(Self::Video),
      "binary" => Ok(Self::Binary),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }
}

#[cfg(test)]
mod tests {
  use crate::by_table::media_uploads::media_upload_type::MediaUploadType;
  use crate::test_helpers::assert_serialization;

  #[test]
  fn test_serialization() {
    assert_serialization(MediaUploadType::Audio, "audio");
    assert_serialization(MediaUploadType::Image, "image");
    assert_serialization(MediaUploadType::Video, "video");
    assert_serialization(MediaUploadType::Binary, "binary");
  }

  #[test]
  fn test_to_str() {
    assert_eq!(MediaUploadType::Audio.to_str(), "audio");
    assert_eq!(MediaUploadType::Image.to_str(), "image");
    assert_eq!(MediaUploadType::Video.to_str(), "video");
    assert_eq!(MediaUploadType::Binary.to_str(), "binary");
  }

  #[test]
  fn test_from_str() {
    assert_eq!(MediaUploadType::from_str("audio").unwrap(), MediaUploadType::Audio);
    assert_eq!(MediaUploadType::from_str("image").unwrap(), MediaUploadType::Image);
    assert_eq!(MediaUploadType::from_str("video").unwrap(), MediaUploadType::Video);
    assert_eq!(MediaUploadType::from_str("binary").unwrap(), MediaUploadType::Binary);
    assert!(MediaUploadType::from_str("foo").is_err());
  }
}
