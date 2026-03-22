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

#[cfg(test)]
mod tests {
  use super::MediaUploadType;
  use enums_shared::test_helpers::{assert_deserialization, assert_serialization};
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(MediaUploadType::Audio, "audio");
      assert_serialization(MediaUploadType::Image, "image");
      assert_serialization(MediaUploadType::Video, "video");
      assert_serialization(MediaUploadType::Binary, "binary");
    }

    #[test]
    fn test_deserialization() {
      assert_deserialization("audio", MediaUploadType::Audio);
      assert_deserialization("image", MediaUploadType::Image);
      assert_deserialization("video", MediaUploadType::Video);
      assert_deserialization("binary", MediaUploadType::Binary);
    }

    #[test]
    fn variants_count_check() {
      assert_eq!(MediaUploadType::iter().count(), 4);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in MediaUploadType::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: MediaUploadType = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
