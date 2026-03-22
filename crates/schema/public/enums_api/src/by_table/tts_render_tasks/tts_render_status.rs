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
  use enums_shared::test_helpers::{assert_deserialization, assert_serialization};
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(TtsRenderStatus::New, "new");
      assert_serialization(TtsRenderStatus::Processing, "processing");
      assert_serialization(TtsRenderStatus::Skipped, "skipped");
      assert_serialization(TtsRenderStatus::Failed, "failed");
      assert_serialization(TtsRenderStatus::PermanentlyFailed, "permanently_failed");
      assert_serialization(TtsRenderStatus::Success, "success");
    }

    #[test]
    fn test_deserialization() {
      assert_deserialization("new", TtsRenderStatus::New);
      assert_deserialization("processing", TtsRenderStatus::Processing);
      assert_deserialization("skipped", TtsRenderStatus::Skipped);
      assert_deserialization("failed", TtsRenderStatus::Failed);
      assert_deserialization("permanently_failed", TtsRenderStatus::PermanentlyFailed);
      assert_deserialization("success", TtsRenderStatus::Success);
    }

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
