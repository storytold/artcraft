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

#[cfg(test)]
mod tests {
  use super::TtsRenderStatus;
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn variants_count_check() {
      assert_eq!(TtsRenderStatus::iter().count(), 6);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in TtsRenderStatus::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: TtsRenderStatus = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
