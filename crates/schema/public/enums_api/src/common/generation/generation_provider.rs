//! This is an important enum.
//!
//! It's used in storyteller-web inference generation, the cost estimate handler,
//! the ArtCraft Tauri app, and more.
//!
//! Do not change the values here without cause or care.

use strum::EnumCount;
use strum::EnumIter;
use utoipa::ToSchema;

/// NB: Keep the max length to 16 characters.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, Ord, PartialOrd, Serialize, Deserialize, ToSchema, EnumIter, EnumCount)]
#[serde(rename_all = "snake_case")]
pub enum GenerationProvider {
  Artcraft,
  Fal,
  Grok,
  Midjourney,
  Sora,
  WorldLabs,

  // /// Catch-all for values the client doesn't yet know about.
  // ///
  // /// We need this to help prevent old versions of deployed-in-the-field
  // /// apps from breaking, eg. Tauri Desktop, when new enum variants are added.
  // /// This will stop deserialization from failing, but the client still has
  // /// to behave intelligently.
  // ///
  // /// The contained string is the raw serialized value from the server.
  // #[serde(untagged)]
  // Unknown(String),
}

#[cfg(test)]
mod tests {
  use super::GenerationProvider;
  use enums_shared::test_helpers::{assert_deserialization, assert_serialization};
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

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
    fn test_deserialization() {
      assert_deserialization("artcraft", GenerationProvider::Artcraft);
      assert_deserialization("fal", GenerationProvider::Fal);
      assert_deserialization("grok", GenerationProvider::Grok);
      assert_deserialization("midjourney", GenerationProvider::Midjourney);
      assert_deserialization("sora", GenerationProvider::Sora);
      assert_deserialization("world_labs", GenerationProvider::WorldLabs);
    }
    #[test]
    fn variants_count_check() {
      assert_eq!(GenerationProvider::iter().count(), 6);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in GenerationProvider::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: GenerationProvider = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
