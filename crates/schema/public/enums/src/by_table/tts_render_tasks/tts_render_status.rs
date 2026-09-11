use serde::Deserialize;
use serde::Serialize;
#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;

/// Used in the SqLite `tts_render_tasks` table in a `TEXT` field named `tts_render_status`.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, Eq, PartialEq, Hash, Deserialize, Serialize)]
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

// TODO(bt, 2023-01-17): This desperately needs Sqlite integration tests!
impl_enum_display_and_debug_using_to_str!(TtsRenderStatus);
impl_sqlite_enum_coders!(TtsRenderStatus);

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
  use crate::by_table::tts_render_tasks::tts_render_status::TtsRenderStatus;
  use crate::test_helpers::assert_serialization;

  mod serde {
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
  }

  mod impl_methods {
    use super::*;

    #[test]
    fn test_to_str() {
      assert_eq!(TtsRenderStatus::New.to_str(), "new");
      assert_eq!(TtsRenderStatus::Processing.to_str(), "processing");
      assert_eq!(TtsRenderStatus::Skipped.to_str(), "skipped");
      assert_eq!(TtsRenderStatus::Failed.to_str(), "failed");
      assert_eq!(TtsRenderStatus::PermanentlyFailed.to_str(), "permanently_failed");
      assert_eq!(TtsRenderStatus::Success.to_str(), "success");
    }

    #[test]
    fn test_from_str() {
      assert_eq!(TtsRenderStatus::from_str("new").unwrap(), TtsRenderStatus::New);
      assert_eq!(TtsRenderStatus::from_str("processing").unwrap(), TtsRenderStatus::Processing);
      assert_eq!(TtsRenderStatus::from_str("skipped").unwrap(), TtsRenderStatus::Skipped);
      assert_eq!(TtsRenderStatus::from_str("failed").unwrap(), TtsRenderStatus::Failed);
      assert_eq!(TtsRenderStatus::from_str("permanently_failed").unwrap(), TtsRenderStatus::PermanentlyFailed);
      assert_eq!(TtsRenderStatus::from_str("success").unwrap(), TtsRenderStatus::Success);
      assert!(TtsRenderStatus::from_str("foo").is_err());
    }
  }
}
