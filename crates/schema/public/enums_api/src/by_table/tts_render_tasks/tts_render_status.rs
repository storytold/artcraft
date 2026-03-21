use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the SqLite `tts_render_tasks` table in a `TEXT` field named `tts_render_status`.
#[derive(Clone, Copy, Eq, PartialEq, Hash, Deserialize, Serialize, ToSchema, EnumIter, Debug)]
pub enum TtsRenderStatus {
  #[serde(rename = "new")]
  New,

  // TODO: Added to fix a big. This whole enum should die.
  #[serde(rename = "processing")]
  Processing,

  #[serde(rename = "skipped")]
  Skipped,

  #[serde(rename = "failed")]
  Failed,

  #[serde(rename = "permanently_failed")]
  PermanentlyFailed,

  #[serde(rename = "success")]
  Success,
}

/// NB: Legacy API for older code.
impl TtsRenderStatus {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::New => "new",
      Self::Processing => "processing",
      Self::Skipped => "skipped",
      Self::Failed => "failed",
      Self::PermanentlyFailed => "permanently_failed",
      Self::Success => "success",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "new" => Ok(Self::New),
      "processing" => Ok(Self::Processing),
      "skipped" => Ok(Self::Skipped),
      "failed" => Ok(Self::Failed),
      "permanently_failed" => Ok(Self::PermanentlyFailed),
      "success" => Ok(Self::Success),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }
}

#[cfg(test)]
mod tests {
  use super::TtsRenderStatus;
  use strum::IntoEnumIterator;

  #[test]
  fn round_trip_json() {
    for variant in TtsRenderStatus::iter() {
      let json = serde_json::to_string(&variant).unwrap();
      let back: TtsRenderStatus = serde_json::from_str(&json).unwrap();
      assert_eq!(variant, back);
    }
  }
}
