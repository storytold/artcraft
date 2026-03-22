
use strum::EnumIter;
use utoipa::ToSchema;

#[derive(Clone, Debug, Copy, PartialEq, Eq, Hash, Ord, PartialOrd, Serialize, EnumIter, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]

pub enum TaskMediaFileClass {
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
  use super::TaskMediaFileClass;
  use enums_shared::test_helpers::{assert_deserialization, assert_serialization};
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(TaskMediaFileClass::Audio, "audio");
      assert_serialization(TaskMediaFileClass::Image, "image");
      assert_serialization(TaskMediaFileClass::Video, "video");
      assert_serialization(TaskMediaFileClass::Dimensional, "dimensional");
    }

    #[test]
    fn test_deserialization() {
      assert_deserialization("audio", TaskMediaFileClass::Audio);
      assert_deserialization("image", TaskMediaFileClass::Image);
      assert_deserialization("video", TaskMediaFileClass::Video);
      assert_deserialization("dimensional", TaskMediaFileClass::Dimensional);
    }

    #[test]
    fn variants_count_check() {
      assert_eq!(TaskMediaFileClass::iter().count(), 4);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in TaskMediaFileClass::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: TaskMediaFileClass = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
