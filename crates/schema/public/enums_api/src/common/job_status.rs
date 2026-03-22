use std::collections::BTreeSet;

use strum::EnumIter;
use utoipa::ToSchema;

/// This is used in nearly every job system as an actual MySQL ENUM value:
///
///  - tts_download_job
///  - tts_inference_job
///  - w2l_download_job
///  - w2l_inference_job
///  - generic_download_job
///  - (NOT generic_inference_job, which uses JobStatusPlus)
///
/// See the documentation on the table for usage.
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.

#[derive(Clone, Debug, Copy, PartialEq, Eq, Hash, Ord, PartialOrd, Serialize, ToSchema, EnumIter, Deserialize)]
#[cfg_attr(feature = "database", derive(sqlx::Type))]
#[cfg_attr(feature = "database", sqlx(rename_all = "snake_case"))]
#[serde(rename_all = "snake_case")]
pub enum JobStatus {
  Pending,
  Started,
  CompleteSuccess,
  CompleteFailure,
  AttemptFailed,
  Dead,
}

// TODO(bt, 2022-12-21): This desperately needs MySQL integration tests!


impl JobStatus {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::Pending => "pending",
      Self::Started => "started",
      Self::CompleteSuccess => "complete_success",
      Self::CompleteFailure => "complete_failure",
      Self::AttemptFailed => "attempt_failed",
      Self::Dead => "dead",
    }
  }

  pub fn from_str(job_status: &str) -> Result<Self, String> {
    match job_status {
      "pending" => Ok(Self::Pending),
      "started" => Ok(Self::Started),
      "complete_success" => Ok(Self::CompleteSuccess),
      "complete_failure" => Ok(Self::CompleteFailure),
      "attempt_failed" => Ok(Self::AttemptFailed),
      "dead" => Ok(Self::Dead),
      _ => Err(format!("invalid job_status: {:?}", job_status)),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    // NB: BTreeSet is sorted
    // NB: BTreeSet::from() isn't const, but not worth using LazyStatic, etc.
    BTreeSet::from([
      Self::Pending,
      Self::Started,
      Self::CompleteSuccess,
      Self::CompleteFailure,
      Self::AttemptFailed,
      Self::Dead,
    ])
  }
}

#[cfg(test)]
mod tests {
  use super::JobStatus;
  use strum::IntoEnumIterator;

  #[test]
  fn round_trip_json() {
    for variant in JobStatus::iter() {
      let json = serde_json::to_string(&variant).unwrap();
      let back: JobStatus = serde_json::from_str(&json).unwrap();
      assert_eq!(variant, back);
    }
  }
}
