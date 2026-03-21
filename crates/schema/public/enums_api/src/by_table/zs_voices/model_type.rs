use std::collections::BTreeSet;

use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `zs_voices` table in a `VARCHAR(16)` field named `model_type`.
///
/// This indicates what type of features are used in the embeddings.
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize, ToSchema, EnumIter, Debug)]
pub enum ZsVoiceModelType {
  /// TTS-type zero shot models
  #[serde(rename = "vall-e-x")]
  VallEX,
  #[serde(rename = "styletts2")]
  StyleTTS2,
}

/// NB: Legacy API for older code.
impl ZsVoiceModelType {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::VallEX=> "vall-e-x",
      Self::StyleTTS2 => "styletts2",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "vall-e-x" => Ok(Self::VallEX),
      "styletts2" => Ok(Self::StyleTTS2),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    // NB: BTreeSet is sorted
    // NB: BTreeSet::from() isn't const, but not worth using LazyStatic, etc.
    BTreeSet::from([
      Self::VallEX,
      Self::StyleTTS2,
    ])
  }
}

#[cfg(test)]
mod tests {
  use super::ZsVoiceModelType;
  use strum::IntoEnumIterator;

  #[test]
  fn round_trip_json() {
    for variant in ZsVoiceModelType::iter() {
      let json = serde_json::to_string(&variant).unwrap();
      let back: ZsVoiceModelType = serde_json::from_str(&json).unwrap();
      assert_eq!(variant, back);
    }
  }
}
