use enums_shared::error::enums_error::EnumsError;
use strum::EnumCount;
use strum::EnumIter;

#[derive(Clone, Copy, PartialEq, Eq, Hash, Ord, PartialOrd, Serialize, Deserialize, EnumIter, EnumCount)]
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

  pub fn from_str(value: &str) -> Result<Self, EnumsError> {
    match value {
      "audio" => Ok(Self::Audio),
      "image" => Ok(Self::Image),
      "video" => Ok(Self::Video),
      "dimensional" => Ok(Self::Dimensional),
      _ => Err(EnumsError::CouldNotConvertFromString(value.to_string())),
    }
  }

}

#[cfg(test)]
mod tests {
  use super::TaskMediaFileClass;
  use enums_shared::test_helpers::assert_serialization;

  mod explicit_checks {
    use super::*;
    use enums_shared::error::enums_error::EnumsError;

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
      if let Err(EnumsError::CouldNotConvertFromString(value)) = result {
        assert_eq!(value, "asdf");
      } else {
        panic!("Expected EnumsError::CouldNotConvertFromString");
      }
    }

  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip() {
      use strum::IntoEnumIterator;
      for variant in TaskMediaFileClass::iter() {
        // Test to_str(), from_str(), Display, and Debug.
        assert_eq!(variant, TaskMediaFileClass::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, TaskMediaFileClass::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, TaskMediaFileClass::from_str(&format!("{:?}", variant)).unwrap());
      }
    }
  
    #[test]
    fn serialized_length_ok_for_database() {
      const MAX_LENGTH: usize = 32; // TODO(bt): Confirm database column width, then remove this comment.
      use strum::IntoEnumIterator;
      for variant in TaskMediaFileClass::iter() {
        let serialized = variant.to_str();
        assert!(!serialized.is_empty(), "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long", variant);
      }
    }
  }
}
