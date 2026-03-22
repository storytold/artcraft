use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `media_files` table in a `VARCHAR(16)` field.
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[derive(Clone, Copy, Eq, PartialEq, Ord, PartialOrd, Hash, Deserialize, Serialize, ToSchema, EnumIter, Debug)]
#[serde(rename_all = "snake_case")]

pub enum MediaFileClass {
  /// Unknown (default value)
  /// This will be present until we migrate all old files.
  Unknown,

  /// Audio files: wav, mp3, etc.
  Audio,

  /// Image files: png, jpeg, etc.
  Image,

  /// Video files: mp4, etc.
  Video,

  /// 3D engine data: glb, gltf, etc.
  Dimensional,
}

#[cfg(test)]
mod tests {
  use super::MediaFileClass;
  use enums_shared::test_helpers::{assert_deserialization, assert_serialization};
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(MediaFileClass::Unknown, "unknown");
      assert_serialization(MediaFileClass::Audio, "audio");
      assert_serialization(MediaFileClass::Image, "image");
      assert_serialization(MediaFileClass::Video, "video");
      assert_serialization(MediaFileClass::Dimensional, "dimensional");
    }

    #[test]
    fn test_deserialization() {
      assert_deserialization("unknown", MediaFileClass::Unknown);
      assert_deserialization("audio", MediaFileClass::Audio);
      assert_deserialization("image", MediaFileClass::Image);
      assert_deserialization("video", MediaFileClass::Video);
      assert_deserialization("dimensional", MediaFileClass::Dimensional);
    }

    #[test]
    fn variants_count_check() {
      assert_eq!(MediaFileClass::iter().count(), 5);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in MediaFileClass::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: MediaFileClass = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
