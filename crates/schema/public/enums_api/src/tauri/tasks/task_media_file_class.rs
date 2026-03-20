
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
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

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
