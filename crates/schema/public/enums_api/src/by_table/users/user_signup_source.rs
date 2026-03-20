use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `users` table in a `VARCHAR(255)` (which should be a `VARCHAR(16)`) field, `maybe_source`.
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[derive(Clone, Copy, Eq, PartialEq, Ord, PartialOrd, Deserialize, Serialize, ToSchema, EnumIter, Debug)]
#[serde(rename_all = "snake_case")]

pub enum UserSignupSource {
  #[deprecated(since = "2026-01-30", note = "Use other Artcraft* enum variants instead")]
  #[serde(rename = "artcraft")]
  ArtCraft,

  /// ArtCraft Tauri App Onboard Flow
  #[serde(rename = "artcraft_app")]
  ArtCraftApp,

  /// artcraft.ai normal onboard flow
  #[serde(rename = "artcraft_ai_web")]
  ArtCraftAiWeb,

  /// artcraft.ai stripe checkout flow
  #[serde(rename = "artcraft_ai_s")]
  ArtCraftAiStripe,

  /// getartcraft.com normal onboard flow
  #[serde(rename = "artcraft_get_web")]
  ArtCraftGetWeb,

  /// getartcraft.com stripe checkout flow
  #[serde(rename = "artcraft_get_s")]
  ArtCraftGetStripe,

  #[serde(rename = "fakeyou")]
  FakeYou,
  
  #[serde(rename = "storyteller")]
  Storyteller,
}

#[cfg(test)]
mod tests {
  use super::UserSignupSource;
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn variants_count_check() {
      assert_eq!(UserSignupSource::iter().count(), 8);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in UserSignupSource::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: UserSignupSource = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
