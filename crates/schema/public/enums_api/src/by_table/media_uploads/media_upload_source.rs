use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `media_uploads` table in a `VARCHAR` field `media_source`.
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[derive(Clone, Copy, Eq, PartialEq, Deserialize, Serialize, ToSchema, EnumIter, Debug)]

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

#[cfg(test)]
mod tests {
  use super::MediaUploadSource;
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn variants_count_check() {
      assert_eq!(MediaUploadSource::iter().count(), 3);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in MediaUploadSource::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: MediaUploadSource = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
