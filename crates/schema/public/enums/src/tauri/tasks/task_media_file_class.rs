use std::collections::BTreeSet;

use crate::error::enum_error::EnumError;
#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;
use utoipa::ToSchema;

#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, PartialEq, Eq, Hash, Ord, PartialOrd, Serialize, Deserialize, ToSchema)]
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

impl_enum_display_and_debug_using_to_str!(TaskMediaFileClass);
//impl_mysql_enum_coders!(TaskMediaFileType);
//impl_mysql_from_row!(TaskMediaFileType);

// NB: We can derive `sqlx::Type` instead of using `impl_mysql_enum_coders`

impl TaskMediaFileClass {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::Audio => "audio",
      Self::Image => "image",
      Self::Video => "video",
      Self::Dimensional => "dimensional",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, EnumError> {
    match value {
      "audio" => Ok(Self::Audio),
      "image" => Ok(Self::Image),
      "video" => Ok(Self::Video),
      "dimensional" => Ok(Self::Dimensional),
      _ => Err(EnumError::CouldNotConvertFromString(value.to_string())),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    // NB: BTreeSet is sorted
    // NB: BTreeSet::from() isn't const, but not worth using LazyStatic, etc.
    BTreeSet::from([
      Self::Audio,
      Self::Image,
      Self::Video,
      Self::Dimensional,
    ])
  }
}

#[cfg(test)]
mod tests {
  use crate::tauri::tasks::task_media_file_class::TaskMediaFileClass;
  use crate::test_helpers::assert_serialization;

  mod explicit_checks {
    use super::*;
    use crate::error::enum_error::EnumError;

    #[test]
    fn test_serialization() {
      assert_serialization(TaskMediaFileClass::Audio, "audio");
      assert_serialization(TaskMediaFileClass::Image, "image");
      assert_serialization(TaskMediaFileClass::Video, "video");
      assert_serialization(TaskMediaFileClass::Dimensional, "dimensional");
    }

    #[test]
    fn to_str() {
      assert_eq!(TaskMediaFileClass::Audio.to_str(), "audio");
      assert_eq!(TaskMediaFileClass::Image.to_str(), "image");
      assert_eq!(TaskMediaFileClass::Video.to_str(), "video");
      assert_eq!(TaskMediaFileClass::Dimensional.to_str(), "dimensional");
    }

    #[test]
    fn from_str() {
      assert_eq!(TaskMediaFileClass::from_str("audio").unwrap(), TaskMediaFileClass::Audio);
      assert_eq!(TaskMediaFileClass::from_str("image").unwrap(), TaskMediaFileClass::Image);
      assert_eq!(TaskMediaFileClass::from_str("video").unwrap(), TaskMediaFileClass::Video);
      assert_eq!(TaskMediaFileClass::from_str("dimensional").unwrap(), TaskMediaFileClass::Dimensional);
    }
    
    #[test]
    fn from_str_err() {
      let result = TaskMediaFileClass::from_str("asdf");
      assert!(result.is_err());
      if let Err(EnumError::CouldNotConvertFromString(value)) = result {
        assert_eq!(value, "asdf");
      } else {
        panic!("Expected EnumError::CouldNotConvertFromString");
      }
    }

    #[test]
    fn all_variants() {
      let mut variants = TaskMediaFileClass::all_variants();
      assert_eq!(variants.len(), 4);
      assert_eq!(variants.pop_first(), Some(TaskMediaFileClass::Audio));
      assert_eq!(variants.pop_first(), Some(TaskMediaFileClass::Image));
      assert_eq!(variants.pop_first(), Some(TaskMediaFileClass::Video));
      assert_eq!(variants.pop_first(), Some(TaskMediaFileClass::Dimensional));
      assert_eq!(variants.pop_first(), None);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn variant_length() {
      use strum::IntoEnumIterator;
      assert_eq!(TaskMediaFileClass::all_variants().len(), TaskMediaFileClass::iter().len());
    }

    #[test]
    fn round_trip() {
      for variant in TaskMediaFileClass::all_variants() {
        // Test to_str(), from_str(), Display, and Debug.
        assert_eq!(variant, TaskMediaFileClass::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, TaskMediaFileClass::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, TaskMediaFileClass::from_str(&format!("{:?}", variant)).unwrap());
      }
    }
  }
}
