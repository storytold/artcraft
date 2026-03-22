use std::collections::BTreeSet;

use strum::EnumIter;
use utoipa::ToSchema;

/// NB: This will be used by a variety of tables (MySQL and sqlite)!
/// Keep the max length to 16 characters.
#[derive(Clone, Debug, Copy, PartialEq, Eq, Hash, Ord, PartialOrd, Serialize, EnumIter, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum ArtcraftCreditsPackSlug {
  #[serde(rename= "artcraft_1000")]
  Artcraft1000,
  #[serde(rename= "artcraft_2500")]
  Artcraft2500,
  #[serde(rename= "artcraft_5000")]
  Artcraft5000,
  #[serde(rename= "artcraft_10000")]
  Artcraft10000,
  #[serde(rename= "artcraft_25000")]
  Artcraft25000,
  #[serde(rename= "artcraft_50000")]
  Artcraft50000,
}



impl ArtcraftCreditsPackSlug {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::Artcraft1000 => "artcraft_1000",
      Self::Artcraft2500 => "artcraft_2500",
      Self::Artcraft5000 => "artcraft_5000",
      Self::Artcraft10000 => "artcraft_10000",
      Self::Artcraft25000 => "artcraft_25000",
      Self::Artcraft50000 => "artcraft_50000",
    }
  }

  pub fn from_str(s: &str) -> Result<Self, String> {
    match s {
      "artcraft_1000" => Ok(Self::Artcraft1000),
      "artcraft_2500" => Ok(Self::Artcraft2500),
      "artcraft_5000" => Ok(Self::Artcraft5000),
      "artcraft_10000" => Ok(Self::Artcraft10000),
      "artcraft_25000" => Ok(Self::Artcraft25000),
      "artcraft_50000" => Ok(Self::Artcraft50000),
      _ => Err(format!("invalid artcraft_credits_pack_slug: {:?}", s)),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    // NB: BTreeSet is sorted
    // NB: BTreeSet::from() isn't const, but not worth using LazyStatic, etc.
    BTreeSet::from([
      Self::Artcraft1000,
      Self::Artcraft2500,
      Self::Artcraft5000,
      Self::Artcraft10000,
      Self::Artcraft25000,
      Self::Artcraft50000,
    ])
  }
}

#[cfg(test)]
mod tests {
  use super::ArtcraftCreditsPackSlug;
  use strum::IntoEnumIterator;

  #[test]
  fn round_trip_json() {
    for variant in ArtcraftCreditsPackSlug::iter() {
      let json = serde_json::to_string(&variant).unwrap();
      let back: ArtcraftCreditsPackSlug = serde_json::from_str(&json).unwrap();
      assert_eq!(variant, back);
    }
  }
}
