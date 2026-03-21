use std::collections::BTreeSet;

use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `zs_voices` table in a `VARCHAR(16)` field named `model_category`.
///
/// This indicates what type of features are used in the embeddings.
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize, ToSchema, EnumIter, Debug)]
pub enum ZsVoiceModelCategory {
  /// TTS-type zero shot models
  #[serde(rename = "tts")]
  Tts,
}

/// NB: Legacy API for older code.
impl ZsVoiceModelCategory {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::Tts => "tts",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "tts" => Ok(Self::Tts),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    // NB: BTreeSet is sorted
    // NB: BTreeSet::from() isn't const, but not worth using LazyStatic, etc.
    BTreeSet::from([
      Self::Tts,
    ])
  }
}

#[cfg(test)]
mod tests {
  use super::ZsVoiceModelCategory;
  use strum::IntoEnumIterator;

  #[test]
  fn round_trip_json() {
    for variant in ZsVoiceModelCategory::iter() {
      let json = serde_json::to_string(&variant).unwrap();
      let back: ZsVoiceModelCategory = serde_json::from_str(&json).unwrap();
      assert_eq!(variant, back);
    }
  }
}
