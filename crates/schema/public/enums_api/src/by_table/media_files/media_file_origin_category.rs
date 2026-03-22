use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `media_files` table in a `VARCHAR` field.
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize, ToSchema, EnumIter, Debug)]
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

#[cfg(test)]
mod tests {
  use super::MediaFileOriginCategory;
  use enums_shared::test_helpers::{assert_deserialization, assert_serialization};
  use strum::IntoEnumIterator;

  mod manual_checks {
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
    fn test_deserialization() {
      assert_deserialization("inference", MediaFileOriginCategory::Inference);
      assert_deserialization("processed", MediaFileOriginCategory::Processed);
      assert_deserialization("upload", MediaFileOriginCategory::Upload);
      assert_deserialization("device_api", MediaFileOriginCategory::DeviceApi);
      assert_deserialization("studio", MediaFileOriginCategory::StorytellerStudio);
      assert_deserialization("story_engine", MediaFileOriginCategory::StoryEngine);
    }

    #[test]
    fn variants_count_check() {
      assert_eq!(MediaFileOriginCategory::iter().count(), 6);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in MediaFileOriginCategory::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: MediaFileOriginCategory = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
