use std::collections::BTreeSet;

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

  pub fn all_variants() -> BTreeSet<Self> {
    // NB: BTreeSet is sorted
    // NB: BTreeSet::from() isn't const, but not worth using LazyStatic, etc.
    BTreeSet::from([
      Self::Inference,
      Self::Processed,
      Self::Upload,
      Self::DeviceApi,
      Self::StorytellerStudio,
      Self::StoryEngine,
    ])
  }
}

#[cfg(test)]
mod tests {
  use super::MediaFileOriginCategory;
  use strum::IntoEnumIterator;

  #[test]
  fn round_trip_json() {
    for variant in MediaFileOriginCategory::iter() {
      let json = serde_json::to_string(&variant).unwrap();
      let back: MediaFileOriginCategory = serde_json::from_str(&json).unwrap();
      assert_eq!(variant, back);
    }
  }
}
