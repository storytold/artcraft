use std::collections::BTreeSet;

use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `batch_generations` table in a `VARCHAR(32)` field named `entity_type`.
#[derive(Clone, Copy, Eq, PartialEq, Hash, Deserialize, Serialize, Ord, PartialOrd, ToSchema, EnumIter, Debug)]
pub enum BetaKeyProduct {
  /// Media files
  /// This will probably be the only type supported, but we'll leave the possibility of future types.
  #[serde(rename = "studio")]
  Studio,
}

/// NB: Legacy API for older code.
impl BetaKeyProduct {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::Studio => "studio",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "studio" => Ok(Self::Studio),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    // NB: BTreeSet is sorted
    // NB: BTreeSet::from() isn't const, but not worth using LazyStatic, etc.
    BTreeSet::from([
      Self::Studio,
    ])
  }
}

#[cfg(test)]
mod tests {
  use super::BetaKeyProduct;
  use strum::IntoEnumIterator;

  #[test]
  fn round_trip_json() {
    for variant in BetaKeyProduct::iter() {
      let json = serde_json::to_string(&variant).unwrap();
      let back: BetaKeyProduct = serde_json::from_str(&json).unwrap();
      assert_eq!(variant, back);
    }
  }
}
