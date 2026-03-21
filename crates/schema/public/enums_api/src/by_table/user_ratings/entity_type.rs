use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `user_ratings` table in a `VARCHAR(32)` field named `entity_type`.
#[derive(Clone, Copy, Eq, PartialEq, Hash, Deserialize, Serialize, ToSchema, EnumIter, Debug)]
pub enum UserRatingEntityType {
  /// Media files (inference results, uploads, etc.)
  #[serde(rename = "media_file")]
  MediaFile,

  /// Model weights (modern, polymorphic, type agnostic)
  #[serde(rename = "model_weight")]
  ModelWeight,

  /// TTS model (architecture does not matter)
  #[serde(rename = "tts_model")]
  TtsModel,

  /// TTS result (architecture does not matter)
  #[serde(rename = "tts_result")]
  TtsResult,

  /// W2L template
  #[serde(rename = "w2l_template")]
  W2lTemplate,

  /// W2L result
  #[serde(rename = "w2l_result")]
  W2lResult,
}

/// NB: Legacy API for older code.
impl UserRatingEntityType {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::MediaFile => "media_file",
      Self::ModelWeight => "model_weight",
      Self::TtsModel => "tts_model",
      Self::TtsResult => "tts_result",
      Self::W2lTemplate => "w2l_template",
      Self::W2lResult => "w2l_result",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "media_file" => Ok(Self::MediaFile),
      "model_weight" => Ok(Self::ModelWeight),
      "tts_model" => Ok(Self::TtsModel),
      "tts_result" => Ok(Self::TtsResult),
      "w2l_template" => Ok(Self::W2lTemplate),
      "w2l_result" => Ok(Self::W2lResult),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }
}

#[cfg(test)]
mod tests {
  use super::UserRatingEntityType;
  use strum::IntoEnumIterator;

  #[test]
  fn round_trip_json() {
    for variant in UserRatingEntityType::iter() {
      let json = serde_json::to_string(&variant).unwrap();
      let back: UserRatingEntityType = serde_json::from_str(&json).unwrap();
      assert_eq!(variant, back);
    }
  }
}
