use std::collections::BTreeSet;

use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `zs_voices` table in a `VARCHAR(16)` field named `encoding_type`.
///
/// This indicates what type of features are used in the embeddings.
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize, ToSchema, EnumIter, Debug)]
pub enum ZsVoiceEncodingType {
  /// Encodec features
  #[serde(rename = "encodec")]
  Encodec,
}

/// NB: Legacy API for older code.
impl ZsVoiceEncodingType {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::Encodec => "encodec",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "encodec" => Ok(Self::Encodec),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    // NB: BTreeSet is sorted
    // NB: BTreeSet::from() isn't const, but not worth using LazyStatic, etc.
    BTreeSet::from([
      Self::Encodec,
    ])
  }
}

#[cfg(test)]
mod tests {
  use super::ZsVoiceEncodingType;
  use strum::IntoEnumIterator;

  #[test]
  fn round_trip_json() {
    for variant in ZsVoiceEncodingType::iter() {
      let json = serde_json::to_string(&variant).unwrap();
      let back: ZsVoiceEncodingType = serde_json::from_str(&json).unwrap();
      assert_eq!(variant, back);
    }
  }
}
