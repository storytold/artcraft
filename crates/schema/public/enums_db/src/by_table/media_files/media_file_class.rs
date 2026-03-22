use strum::EnumCount;
use strum::EnumIter;

/// Used in the `media_files` table in a `VARCHAR(16)` field.
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[derive(Clone, Copy, Eq, PartialEq, Ord, PartialOrd, Hash, Deserialize, Serialize, EnumIter, EnumCount)]
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

// TODO(bt, 2022-12-21): This desperately needs MySQL integration tests!
impl_enum_display_and_debug_using_to_str!(MediaFileClass);
impl_mysql_enum_coders!(MediaFileClass);
impl_mysql_from_row!(MediaFileClass);

/// NB: Legacy API for older code.
impl MediaFileClass {
  pub const fn to_str(&self) -> &'static str {
    match self {
      Self::Unknown => "unknown",
      Self::Audio => "audio",
      Self::Image => "image",
      Self::Video => "video",
      Self::Dimensional => "dimensional",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "unknown" => Ok(Self::Unknown),
      "audio" => Ok(Self::Audio),
      "image" => Ok(Self::Image),
      "video" => Ok(Self::Video),
      "dimensional" => Ok(Self::Dimensional),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }

}

#[cfg(test)]
mod tests {
  use super::super::media_file_class::MediaFileClass;
  use enums_shared::test_helpers::assert_serialization;

  mod serde {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(MediaFileClass::Unknown, "unknown");
      assert_serialization(MediaFileClass::Audio, "audio");
      assert_serialization(MediaFileClass::Image, "image");
      assert_serialization(MediaFileClass::Video, "video");
      assert_serialization(MediaFileClass::Dimensional, "dimensional");
    }
  }

  mod impl_methods {
    use super::*;

    #[test]
    fn to_str() {
      assert_eq!(MediaFileClass::Unknown.to_str(), "unknown");
      assert_eq!(MediaFileClass::Audio.to_str(), "audio");
      assert_eq!(MediaFileClass::Image.to_str(), "image");
      assert_eq!(MediaFileClass::Video.to_str(), "video");
      assert_eq!(MediaFileClass::Dimensional.to_str(), "dimensional");
    }

    #[test]
    fn from_str() {
      assert_eq!(MediaFileClass::from_str("unknown").unwrap(), MediaFileClass::Unknown);
      assert_eq!(MediaFileClass::from_str("audio").unwrap(), MediaFileClass::Audio);
      assert_eq!(MediaFileClass::from_str("image").unwrap(), MediaFileClass::Image);
      assert_eq!(MediaFileClass::from_str("video").unwrap(), MediaFileClass::Video);
      assert_eq!(MediaFileClass::from_str("dimensional").unwrap(), MediaFileClass::Dimensional);
      assert!(MediaFileClass::from_str("foo").is_err());
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip() {
      use strum::IntoEnumIterator;
      for variant in MediaFileClass::iter() {
        assert_eq!(variant, MediaFileClass::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, MediaFileClass::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, MediaFileClass::from_str(&format!("{:?}", variant)).unwrap());
      }
    }

    #[test]
    fn serialized_length_ok_for_database() {
      use strum::IntoEnumIterator;
      const MAX_LENGTH : usize = 16;
      for variant in MediaFileClass::iter() {
        let serialized = variant.to_str();
        assert!(serialized.len() > 0, "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long", variant);
      }
    }
  }
}
