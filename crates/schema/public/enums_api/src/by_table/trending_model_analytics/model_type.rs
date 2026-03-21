use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `trending_model_analytics` table in a `VARCHAR` field.
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[derive(Clone, Copy, Eq, PartialEq, Deserialize, Serialize, ToSchema, EnumIter, Debug)]
#[serde(rename_all = "lowercase")]
pub enum ModelType {
  /// TTS models
  Tts,

  // NB: It's assumed we'll use this same system to track
  // trending VC models too, so the next type would be "VC".
}

/// NB: Legacy API for older code.
impl ModelType {
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
}

#[cfg(test)]
mod tests {
  use super::ModelType;
  use strum::IntoEnumIterator;

  #[test]
  fn round_trip_json() {
    for variant in ModelType::iter() {
      let json = serde_json::to_string(&variant).unwrap();
      let back: ModelType = serde_json::from_str(&json).unwrap();
      assert_eq!(variant, back);
    }
  }
}
