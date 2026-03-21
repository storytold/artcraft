use std::collections::BTreeSet;

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

/// NB: Legacy API for older code.
impl UserSignupSource {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::ArtCraft => "artcraft",
      Self::ArtCraftApp => "artcraft_app",
      Self::ArtCraftAiWeb => "artcraft_ai_web",
      Self::ArtCraftAiStripe => "artcraft_ai_s",
      Self::ArtCraftGetWeb => "artcraft_get_web",
      Self::ArtCraftGetStripe => "artcraft_get_s",
      Self::FakeYou => "fakeyou",
      Self::Storyteller => "storyteller",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "artcraft" => Ok(Self::ArtCraft),
      "artcraft_app" => Ok(Self::ArtCraftApp),
      "artcraft_ai_web" => Ok(Self::ArtCraftAiWeb),
      "artcraft_ai_s" => Ok(Self::ArtCraftAiStripe),
      "artcraft_get_web" => Ok(Self::ArtCraftGetWeb),
      "artcraft_get_s" => Ok(Self::ArtCraftGetStripe),
      "fakeyou" => Ok(Self::FakeYou),
      "storyteller" => Ok(Self::Storyteller),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    // NB: BTreeSet is sorted
    // NB: BTreeSet::from() isn't const, but not worth using LazyStatic, etc.
    BTreeSet::from([
      Self::ArtCraft,
      Self::ArtCraftApp,
      Self::ArtCraftAiWeb,
      Self::ArtCraftAiStripe,
      Self::ArtCraftGetWeb,
      Self::ArtCraftGetStripe,
      Self::FakeYou,
      Self::Storyteller,
    ])
  }
}

#[cfg(test)]
mod tests {
  use super::UserSignupSource;
  use strum::IntoEnumIterator;

  #[test]
  fn round_trip_json() {
    for variant in UserSignupSource::iter() {
      let json = serde_json::to_string(&variant).unwrap();
      let back: UserSignupSource = serde_json::from_str(&json).unwrap();
      assert_eq!(variant, back);
    }
  }
}
