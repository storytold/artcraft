use strum::EnumCount;
use strum::EnumIter;

/// Used in the `media_files` table in a `VARCHAR` field.
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize, EnumIter, EnumCount)]
#[serde(rename_all = "snake_case")]
pub enum MediaFileOriginCategory {
  /// ML model inference output - uploaded models or zero shot.
  Inference,

  /// Processed results - (we don't have these systems yet, but eg. trim, transcode, etc).
  Processed,

  /// User uploaded files (from their filesystem)
  Upload,

  /// User uploaded files recorded directly from their device (browser, mobile), typically using device APIs.
  DeviceApi,

  /// From Storyteller Studio Engine
  #[deprecated(note="This db field should only denote file provenance, not the product.")]
  #[serde(rename = "studio")]
  StorytellerStudio,

  /// From Storyteller Studio Engine
  #[deprecated(note = "DO NOT USE. Originally deprecated in favor of `StorytellerStudio`.")]
  StoryEngine,
}

// TODO(bt, 2022-12-21): This desperately needs MySQL integration tests!
impl_enum_display_and_debug_using_to_str!(MediaFileOriginCategory);
impl_mysql_enum_coders!(MediaFileOriginCategory);
impl_mysql_from_row!(MediaFileOriginCategory);

/// NB: Legacy API for older code.
impl MediaFileOriginCategory {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::Inference => "inference",
      Self::Processed => "processed",
      Self::Upload => "upload",
      Self::DeviceApi => "device_api",
      Self::StorytellerStudio => "studio",
      Self::StoryEngine => "story_engine",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "inference" => Ok(Self::Inference),
      "processed" => Ok(Self::Processed),
      "upload" => Ok(Self::Upload),
      "device_api" => Ok(Self::DeviceApi),
      "studio" => Ok(Self::StorytellerStudio),
      "story_engine" => Ok(Self::StoryEngine),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }

}

#[cfg(test)]
mod tests {
  use super::super::media_file_origin_category::MediaFileOriginCategory;
  use enums_shared::test_helpers::assert_serialization;

  mod explicit_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(MediaFileOriginCategory::Inference, "inference");
      assert_serialization(MediaFileOriginCategory::Processed, "processed");
      assert_serialization(MediaFileOriginCategory::Upload, "upload");
      assert_serialization(MediaFileOriginCategory::DeviceApi, "device_api");
      assert_serialization(MediaFileOriginCategory::StorytellerStudio, "studio");
      assert_serialization(MediaFileOriginCategory::StoryEngine, "story_engine");
    }

    #[test]
    fn test_to_str() {
      assert_eq!(MediaFileOriginCategory::Inference.to_str(), "inference");
      assert_eq!(MediaFileOriginCategory::Processed.to_str(), "processed");
      assert_eq!(MediaFileOriginCategory::Upload.to_str(), "upload");
      assert_eq!(MediaFileOriginCategory::DeviceApi.to_str(), "device_api");
      assert_eq!(MediaFileOriginCategory::StorytellerStudio.to_str(), "studio");
      assert_eq!(MediaFileOriginCategory::StoryEngine.to_str(), "story_engine");
    }

    #[test]
    fn test_from_str() {
      assert_eq!(MediaFileOriginCategory::from_str("inference").unwrap(), MediaFileOriginCategory::Inference);
      assert_eq!(MediaFileOriginCategory::from_str("processed").unwrap(), MediaFileOriginCategory::Processed);
      assert_eq!(MediaFileOriginCategory::from_str("upload").unwrap(), MediaFileOriginCategory::Upload);
      assert_eq!(MediaFileOriginCategory::from_str("device_api").unwrap(), MediaFileOriginCategory::DeviceApi);
      assert_eq!(MediaFileOriginCategory::from_str("studio").unwrap(), MediaFileOriginCategory::StorytellerStudio);
      assert_eq!(MediaFileOriginCategory::from_str("story_engine").unwrap(), MediaFileOriginCategory::StoryEngine);
      assert!(MediaFileOriginCategory::from_str("foo").is_err());
    }

  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip() {
      use strum::IntoEnumIterator;
      for variant in MediaFileOriginCategory::iter() {
        assert_eq!(variant, MediaFileOriginCategory::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, MediaFileOriginCategory::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, MediaFileOriginCategory::from_str(&format!("{:?}", variant)).unwrap());
      }
    }

    #[test]
    fn serialized_length_ok_for_database() {
      use strum::IntoEnumIterator;
      const MAX_LENGTH : usize = 16;
      for variant in MediaFileOriginCategory::iter() {
        let serialized = variant.to_str();
        assert!(serialized.len() > 0, "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long", variant);
      }
    }
  }
}
