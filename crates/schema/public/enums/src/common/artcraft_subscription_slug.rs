use std::collections::BTreeSet;

#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;
use utoipa::ToSchema;

/// NB: This will be used by a variety of tables (MySQL and sqlite)!
/// Keep the max length to 16 characters.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, PartialEq, Eq, Hash, Ord, PartialOrd, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum ArtcraftSubscriptionSlug {
  ArtcraftBasic,
  ArtcraftPro,
  ArtcraftMax,
}

impl_enum_display_and_debug_using_to_str!(ArtcraftSubscriptionSlug);
impl_mysql_enum_coders!(ArtcraftSubscriptionSlug);
impl_mysql_from_row!(ArtcraftSubscriptionSlug);

// NB: We can derive `sqlx::Type` instead of using `impl_mysql_enum_coders`

impl ArtcraftSubscriptionSlug {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::ArtcraftBasic => "artcraft_basic",
      Self::ArtcraftPro => "artcraft_pro",
      Self::ArtcraftMax => "artcraft_max",
    }
  }

  pub fn from_str(s: &str) -> Result<Self, String> {
    match s {
      "artcraft_basic" => Ok(Self::ArtcraftBasic),
      "artcraft_pro" => Ok(Self::ArtcraftPro),
      "artcraft_max" => Ok(Self::ArtcraftMax),
      _ => Err(format!("invalid artcraft_subscription_slug: {:?}", s)),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    // NB: BTreeSet is sorted
    // NB: BTreeSet::from() isn't const, but not worth using LazyStatic, etc.
    BTreeSet::from([
      Self::ArtcraftBasic,
      Self::ArtcraftPro,
      Self::ArtcraftMax,
    ])
  }
}

#[cfg(test)]
mod tests {
  use crate::common::artcraft_subscription_slug::ArtcraftSubscriptionSlug;
  use crate::test_helpers::assert_serialization;

  mod explicit_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(ArtcraftSubscriptionSlug::ArtcraftBasic, "artcraft_basic");
      assert_serialization(ArtcraftSubscriptionSlug::ArtcraftPro, "artcraft_pro");
      assert_serialization(ArtcraftSubscriptionSlug::ArtcraftMax, "artcraft_max");
    }

    #[test]
    fn to_str() {
      assert_eq!(ArtcraftSubscriptionSlug::ArtcraftBasic.to_str(), "artcraft_basic");
      assert_eq!(ArtcraftSubscriptionSlug::ArtcraftPro.to_str(), "artcraft_pro");
      assert_eq!(ArtcraftSubscriptionSlug::ArtcraftMax.to_str(), "artcraft_max");
    }

    #[test]
    fn from_str() {
      assert_eq!(ArtcraftSubscriptionSlug::from_str("artcraft_basic").unwrap(), ArtcraftSubscriptionSlug::ArtcraftBasic);
      assert_eq!(ArtcraftSubscriptionSlug::from_str("artcraft_pro").unwrap(), ArtcraftSubscriptionSlug::ArtcraftPro);
      assert_eq!(ArtcraftSubscriptionSlug::from_str("artcraft_max").unwrap(), ArtcraftSubscriptionSlug::ArtcraftMax);
    }

    #[test]
    fn all_variants() {
      let mut variants = ArtcraftSubscriptionSlug::all_variants();
      assert_eq!(variants.len(), 3);
      assert_eq!(variants.pop_first(), Some(ArtcraftSubscriptionSlug::ArtcraftBasic));
      assert_eq!(variants.pop_first(), Some(ArtcraftSubscriptionSlug::ArtcraftPro));
      assert_eq!(variants.pop_first(), Some(ArtcraftSubscriptionSlug::ArtcraftMax));
      assert_eq!(variants.pop_first(), None);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn variant_length() {
      use strum::IntoEnumIterator;
      assert_eq!(ArtcraftSubscriptionSlug::all_variants().len(), ArtcraftSubscriptionSlug::iter().len());
    }

    #[test]
    fn round_trip() {
      for variant in ArtcraftSubscriptionSlug::all_variants() {
        // Test to_str(), from_str(), Display, and Debug.
        assert_eq!(variant, ArtcraftSubscriptionSlug::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, ArtcraftSubscriptionSlug::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, ArtcraftSubscriptionSlug::from_str(&format!("{:?}", variant)).unwrap());
      }
    }

    #[test]
    fn serialized_length_ok_for_database() {
      const MAX_LENGTH : usize = 16;
      for variant in ArtcraftSubscriptionSlug::all_variants() {
        let serialized = variant.to_str();
        assert!(serialized.len() > 0, "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long", variant);
      }
    }
  }
}
