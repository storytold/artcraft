use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `tts_models` table in an `ENUM` field.
/// -- Furthermore -- not all enum values are represented !!
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[derive(Clone, Copy, Eq, PartialEq, Deserialize, Serialize, ToSchema, EnumIter, Debug)]
pub enum TtsModelType {
  #[serde(rename = "tacotron2")]
  Tacotron2,

  #[serde(rename = "vits")]
  Vits,
}

/// NB: Legacy API for older code.
impl TtsModelType {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::Tacotron2 => "tacotron2",
      Self::Vits => "vits",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "tacotron2" => Ok(Self::Tacotron2),
      "vits" => Ok(Self::Vits),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }
}

#[cfg(test)]
mod tests {
  use super::TtsModelType;
  use strum::IntoEnumIterator;

  #[test]
  fn round_trip_json() {
    for variant in TtsModelType::iter() {
      let json = serde_json::to_string(&variant).unwrap();
      let back: TtsModelType = serde_json::from_str(&json).unwrap();
      assert_eq!(variant, back);
    }
  }
}
