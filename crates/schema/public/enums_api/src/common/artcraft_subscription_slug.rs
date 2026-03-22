use std::collections::BTreeSet;

use strum::EnumIter;
use utoipa::ToSchema;

/// NB: This will be used by a variety of tables (MySQL and sqlite)!
/// Keep the max length to 16 characters.
#[derive(Clone, Debug, Copy, PartialEq, Eq, Hash, Ord, PartialOrd, Serialize, EnumIter, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum ArtcraftSubscriptionSlug {
  ArtcraftBasic,
  ArtcraftPro,
  ArtcraftMax,
}



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
  use super::ArtcraftSubscriptionSlug;
  use strum::IntoEnumIterator;

  #[test]
  fn round_trip_json() {
    for variant in ArtcraftSubscriptionSlug::iter() {
      let json = serde_json::to_string(&variant).unwrap();
      let back: ArtcraftSubscriptionSlug = serde_json::from_str(&json).unwrap();
      assert_eq!(variant, back);
    }
  }
}
