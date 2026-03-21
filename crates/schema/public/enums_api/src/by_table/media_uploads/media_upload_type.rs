use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `media_uploads` table in a `VARCHAR` field.
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[derive(Clone, Copy, Eq, PartialEq, Deserialize, Serialize, ToSchema, EnumIter, Debug)]
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
  use super::MediaUploadType;
  use strum::IntoEnumIterator;

  #[test]
  fn round_trip_json() {
    for variant in MediaUploadType::iter() {
      let json = serde_json::to_string(&variant).unwrap();
      let back: MediaUploadType = serde_json::from_str(&json).unwrap();
      assert_eq!(variant, back);
    }
  }
}
