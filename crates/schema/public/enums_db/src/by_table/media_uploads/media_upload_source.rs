use strum::EnumCount;
use strum::EnumIter;

/// Used in the `media_uploads` table in a `VARCHAR` field `media_source`.
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[derive(Clone, Copy, Eq, PartialEq, Deserialize, Serialize, EnumIter, EnumCount)]
pub enum MediaUploadSource {
  /// Eg. browser javascript APIs to access the microphone, webcam, etc.
  #[serde(rename = "device_api")]
  DeviceApi,

  /// Uploaded files from the filesystem
  #[serde(rename = "file")]
  File,

  /// Unknown sources
  #[serde(rename = "unknown")]
  Unknown,
}

// TODO(bt, 2022-12-21): This desperately needs MySQL integration tests!
impl_enum_display_and_debug_using_to_str!(MediaUploadSource);
impl_mysql_enum_coders!(MediaUploadSource);
impl_mysql_from_row!(MediaUploadSource);

/// NB: Legacy API for older code.
impl MediaUploadSource {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::DeviceApi => "device_api",
      Self::File => "file",
      Self::Unknown => "unknown",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "device_api" => Ok(Self::DeviceApi),
      "file" => Ok(Self::File),
      "unknown" => Ok(Self::Unknown),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }
}

#[cfg(test)]
mod tests {
  use super::super::media_upload_source::MediaUploadSource;
  use enums_shared::test_helpers::assert_serialization;

  #[test]
  fn test_serialization() {
    assert_serialization(MediaUploadSource::DeviceApi, "device_api");
    assert_serialization(MediaUploadSource::File, "file");
    assert_serialization(MediaUploadSource::Unknown, "unknown");
  }

  #[test]
  fn test_to_str() {
    assert_eq!(MediaUploadSource::DeviceApi.to_str(), "device_api");
    assert_eq!(MediaUploadSource::File.to_str(), "file");
    assert_eq!(MediaUploadSource::Unknown.to_str(), "unknown");
  }

  #[test]
  fn test_from_str() {
    assert_eq!(MediaUploadSource::from_str("device_api").unwrap(), MediaUploadSource::DeviceApi);
    assert_eq!(MediaUploadSource::from_str("file").unwrap(), MediaUploadSource::File);
    assert_eq!(MediaUploadSource::from_str("unknown").unwrap(), MediaUploadSource::Unknown);
    assert!(MediaUploadSource::from_str("foo").is_err());
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip() {
      use strum::IntoEnumIterator;
      for variant in MediaUploadSource::iter() {
        assert_eq!(variant, MediaUploadSource::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, MediaUploadSource::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, MediaUploadSource::from_str(&format!("{:?}", variant)).unwrap());
      }
    }

    #[test]
    fn serialized_length_ok_for_database() {
      const MAX_LENGTH: usize = 16; // TODO(bt): Confirm database column width, then remove this comment.
      use strum::IntoEnumIterator;
      for variant in MediaUploadSource::iter() {
        let serialized = variant.to_str();
        assert!(!serialized.is_empty(), "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long", variant);
      }
    }
  }
}
