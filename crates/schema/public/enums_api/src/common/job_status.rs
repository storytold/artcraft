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
#[serde(rename_all = "snake_case")]

pub enum JobStatus {
  Pending,
  Started,
  CompleteSuccess,
  CompleteFailure,
  AttemptFailed,
  Dead,
}

#[cfg(test)]
mod tests {
  use super::JobStatus;
  use enums_shared::test_helpers::{assert_deserialization, assert_serialization};
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(JobStatus::Pending, "pending");
      assert_serialization(JobStatus::Started, "started");
      assert_serialization(JobStatus::CompleteSuccess, "complete_success");
      assert_serialization(JobStatus::CompleteFailure, "complete_failure");
      assert_serialization(JobStatus::AttemptFailed, "attempt_failed");
      assert_serialization(JobStatus::Dead, "dead");
    }

    #[test]
    fn test_deserialization() {
      assert_deserialization("pending", JobStatus::Pending);
      assert_deserialization("started", JobStatus::Started);
      assert_deserialization("complete_success", JobStatus::CompleteSuccess);
      assert_deserialization("complete_failure", JobStatus::CompleteFailure);
      assert_deserialization("attempt_failed", JobStatus::AttemptFailed);
      assert_deserialization("dead", JobStatus::Dead);
    }

    #[test]
    fn variants_count_check() {
      assert_eq!(JobStatus::iter().count(), 6);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in JobStatus::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: JobStatus = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
