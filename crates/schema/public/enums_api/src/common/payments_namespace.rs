use std::collections::BTreeSet;

use strum::EnumIter;
use utoipa::ToSchema;

/// NB: This will be used by a variety of tables (MySQL and sqlite)!
/// Keep the max length to 16 characters.
#[derive(Clone, Debug, Copy, PartialEq, Eq, Hash, Ord, PartialOrd, Serialize, EnumIter, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum PaymentsNamespace {
  #[serde(rename = "artcraft")]
  Artcraft,
  #[serde(rename = "fakeyou")]
  FakeYou,
}



impl PaymentsNamespace {
  pub const fn to_str(&self) -> &'static str {
    match self {
      Self::Artcraft => "artcraft",
      Self::FakeYou => "fakeyou",
    }
  }

  pub fn from_str(s: &str) -> Result<Self, String> {
    match s {
      "artcraft" => Ok(Self::Artcraft),
      "fakeyou" => Ok(Self::FakeYou),
      _ => Err(format!("invalid subscription_namespace: {:?}", s)),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    // NB: BTreeSet is sorted
    // NB: BTreeSet::from() isn't const, but not worth using LazyStatic, etc.
    BTreeSet::from([
      Self::Artcraft,
      Self::FakeYou,
    ])
  }
}

#[cfg(test)]
mod tests {
  use super::PaymentsNamespace;
  use strum::IntoEnumIterator;

  #[test]
  fn round_trip_json() {
    for variant in PaymentsNamespace::iter() {
      let json = serde_json::to_string(&variant).unwrap();
      let back: PaymentsNamespace = serde_json::from_str(&json).unwrap();
      assert_eq!(variant, back);
    }
  }
}
