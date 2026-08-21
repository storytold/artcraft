// Deprecated model variants (e.g. the Seedance 2.0 Ultra tier) must keep
// their classification arms here so historical rows still map; suppress the
// deprecation lint file-wide.
#![allow(deprecated)]

use std::collections::BTreeSet;

#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `users` table in a `VARCHAR(255)` (which should be a `VARCHAR(16)`) field, `maybe_source`.
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, Eq, PartialEq, Ord, PartialOrd, Deserialize, Serialize, ToSchema)]
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

// TODO(bt, 2022-12-21): This desperately needs MySQL integration tests!
impl_enum_display_and_debug_using_to_str!(UserSignupSource);
impl_mysql_enum_coders!(UserSignupSource);
impl_mysql_from_row!(UserSignupSource);

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
  use crate::by_table::users::user_signup_source::UserSignupSource;
  use crate::test_helpers::assert_serialization;

  mod serde {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(UserSignupSource::ArtCraft, "artcraft");
      assert_serialization(UserSignupSource::ArtCraftApp, "artcraft_app");
      assert_serialization(UserSignupSource::ArtCraftAiWeb, "artcraft_ai_web");
      assert_serialization(UserSignupSource::ArtCraftAiStripe, "artcraft_ai_s");
      assert_serialization(UserSignupSource::ArtCraftGetWeb, "artcraft_get_web");
      assert_serialization(UserSignupSource::ArtCraftGetStripe, "artcraft_get_s");
      assert_serialization(UserSignupSource::FakeYou, "fakeyou");
      assert_serialization(UserSignupSource::Storyteller, "storyteller");
    }
  }

  mod impl_methods {
    use super::*;

    #[test]
    fn to_str() {
      assert_eq!(UserSignupSource::ArtCraft.to_str(), "artcraft");
      assert_eq!(UserSignupSource::ArtCraftApp.to_str(), "artcraft_app");
      assert_eq!(UserSignupSource::ArtCraftAiWeb.to_str(), "artcraft_ai_web");
      assert_eq!(UserSignupSource::ArtCraftAiStripe.to_str(), "artcraft_ai_s");
      assert_eq!(UserSignupSource::ArtCraftGetWeb.to_str(), "artcraft_get_web");
      assert_eq!(UserSignupSource::FakeYou.to_str(), "fakeyou");
      assert_eq!(UserSignupSource::Storyteller.to_str(), "storyteller");
    }

    #[test]
    fn from_str() {
      assert_eq!(UserSignupSource::from_str("artcraft").unwrap(), UserSignupSource::ArtCraft);
      assert_eq!(UserSignupSource::from_str("artcraft_app").unwrap(), UserSignupSource::ArtCraftApp);
      assert_eq!(UserSignupSource::from_str("artcraft_ai_web").unwrap(), UserSignupSource::ArtCraftAiWeb);
      assert_eq!(UserSignupSource::from_str("artcraft_ai_s").unwrap(), UserSignupSource::ArtCraftAiStripe);
      assert_eq!(UserSignupSource::from_str("artcraft_get_web").unwrap(), UserSignupSource::ArtCraftGetWeb);
      assert_eq!(UserSignupSource::from_str("artcraft_get_s").unwrap(), UserSignupSource::ArtCraftGetStripe);
      assert_eq!(UserSignupSource::from_str("fakeyou").unwrap(), UserSignupSource::FakeYou);
      assert_eq!(UserSignupSource::from_str("storyteller").unwrap(), UserSignupSource::Storyteller);
      assert!(UserSignupSource::from_str("foo").is_err());
    }
  }

  mod manual_variant_checks {
    use super::*;

    #[test]
    fn all_variants() {
      let mut variants = UserSignupSource::all_variants();
      assert_eq!(variants.len(), 8);
      assert_eq!(variants.pop_first(), Some(UserSignupSource::ArtCraft));
      assert_eq!(variants.pop_first(), Some(UserSignupSource::ArtCraftApp));
      assert_eq!(variants.pop_first(), Some(UserSignupSource::ArtCraftAiWeb));
      assert_eq!(variants.pop_first(), Some(UserSignupSource::ArtCraftAiStripe));
      assert_eq!(variants.pop_first(), Some(UserSignupSource::ArtCraftGetWeb));
      assert_eq!(variants.pop_first(), Some(UserSignupSource::ArtCraftGetStripe));
      assert_eq!(variants.pop_first(), Some(UserSignupSource::FakeYou));
      assert_eq!(variants.pop_first(), Some(UserSignupSource::Storyteller));
      assert_eq!(variants.pop_first(), None);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn variant_length() {
      use strum::IntoEnumIterator;
      assert_eq!(UserSignupSource::all_variants().len(), UserSignupSource::iter().len());
    }

    #[test]
    fn round_trip() {
      for variant in UserSignupSource::all_variants() {
        assert_eq!(variant, UserSignupSource::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, UserSignupSource::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, UserSignupSource::from_str(&format!("{:?}", variant)).unwrap());
      }
    }

    #[test]
    fn serialized_length_ok_for_database() {
      const MAX_LENGTH : usize = 16;
      for variant in UserSignupSource::all_variants() {
        let serialized = variant.to_str();
        assert!(serialized.len() > 0, "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long", variant);
      }
    }
  }
}
