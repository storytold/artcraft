//! This is an important enum.
//!
//! It's used in storyteller-web inference generation, the cost estimate handler,
//! the ArtCraft Tauri app, and more.
//!
//! Do not change the values here without cause or care.

use std::collections::BTreeSet;

#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;
use utoipa::ToSchema;

/// NB: Keep the max length to 16 characters.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, Ord, PartialOrd, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum GenerationProvider {
  Artcraft,
  Fal,
  Grok,
  Midjourney,
  Sora,
  WorldLabs,
}

impl GenerationProvider {

  pub fn all_variants() -> BTreeSet<Self> {
    BTreeSet::from([
      Self::Artcraft,
      Self::Fal,
      Self::Grok,
      Self::Midjourney,
      Self::Sora,
      Self::WorldLabs,
    ])
  }

}

#[cfg(test)]
mod tests {
  use super::GenerationProvider;
  use enums_shared::test_helpers::assert_serialization;

  #[test]
  fn test_serialization() {
    assert_serialization(GenerationProvider::Artcraft, "artcraft");
    assert_serialization(GenerationProvider::Fal, "fal");
    assert_serialization(GenerationProvider::Grok, "grok");
    assert_serialization(GenerationProvider::Midjourney, "midjourney");
    assert_serialization(GenerationProvider::Sora, "sora");
    assert_serialization(GenerationProvider::WorldLabs, "world_labs");
  }

  #[test]
  fn round_trip_json() {
    use strum::IntoEnumIterator;
    for variant in GenerationProvider::iter() {
      let json = serde_json::to_string(&variant).unwrap();
      let back: GenerationProvider = serde_json::from_str(&json).unwrap();
      assert_eq!(variant, back);
    }
  }
}
