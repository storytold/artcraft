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
  use super::MediaUploadSource;
  use strum::IntoEnumIterator;

  #[test]
  fn round_trip_json() {
    for variant in MediaUploadSource::iter() {
      let json = serde_json::to_string(&variant).unwrap();
      let back: MediaUploadSource = serde_json::from_str(&json).unwrap();
      assert_eq!(variant, back);
    }
  }
}
