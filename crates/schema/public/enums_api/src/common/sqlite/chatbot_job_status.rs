use serde::Deserialize;
use serde::Serialize;
use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the SqLite `web_scraping_targets` table in a `TEXT` field named `scraping_status`.
#[derive(Clone, Debug, Copy, Eq, PartialEq, Hash, Deserialize, Serialize, EnumIter, ToSchema)]
pub enum ChatbotJobStatus {
  #[serde(rename = "new")]
  New,

  #[serde(rename = "skipped")]
  Skipped,

  #[serde(rename = "failed")]
  Failed,

  #[serde(rename = "permanently_failed")]
  PermanentlyFailed,

  #[serde(rename = "success")]
  Success,
}

// TODO(bt, 2023-02-10): This desperately needs Sqlite integration tests!

/// NB: Legacy API for older code.
impl ChatbotJobStatus {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::New => "new",
      Self::Skipped => "skipped",
      Self::Failed => "failed",
      Self::PermanentlyFailed => "permanently_failed",
      Self::Success => "success",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "new" => Ok(Self::New),
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
  use super::ChatbotJobStatus;
  use strum::IntoEnumIterator;

  #[test]
  fn round_trip_json() {
    for variant in ChatbotJobStatus::iter() {
      let json = serde_json::to_string(&variant).unwrap();
      let back: ChatbotJobStatus = serde_json::from_str(&json).unwrap();
      assert_eq!(variant, back);
    }
  }
}
