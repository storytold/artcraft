use std::collections::BTreeSet;

#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;

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

#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[cfg_attr(not(feature = "database"), derive(Clone, Copy, PartialEq, Eq, Hash, Ord, PartialOrd, Serialize, Deserialize))]
#[cfg_attr(feature = "database", derive(Clone, Copy, PartialEq, Eq, Hash, Ord, PartialOrd, Serialize, Deserialize, sqlx::Type))]
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
impl_enum_display_and_debug_using_to_str!(JobStatus);

// NB: We can derive `sqlx::Type` instead of using `impl_mysql_enum_coders`

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
  use crate::common::job_status::JobStatus;
  use crate::test_helpers::assert_serialization;

  mod explicit_checks {
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
    fn to_str() {
      assert_eq!(JobStatus::Pending.to_str(), "pending");
      assert_eq!(JobStatus::Started.to_str(), "started");
      assert_eq!(JobStatus::CompleteSuccess.to_str(), "complete_success");
      assert_eq!(JobStatus::CompleteFailure.to_str(), "complete_failure");
      assert_eq!(JobStatus::AttemptFailed.to_str(), "attempt_failed");
      assert_eq!(JobStatus::Dead.to_str(), "dead");
    }

    #[test]
    fn from_str() {
      assert_eq!(JobStatus::from_str("pending").unwrap(), JobStatus::Pending);
      assert_eq!(JobStatus::from_str("started").unwrap(), JobStatus::Started);
      assert_eq!(JobStatus::from_str("complete_success").unwrap(), JobStatus::CompleteSuccess);
      assert_eq!(JobStatus::from_str("complete_failure").unwrap(), JobStatus::CompleteFailure);
      assert_eq!(JobStatus::from_str("attempt_failed").unwrap(), JobStatus::AttemptFailed);
      assert_eq!(JobStatus::from_str("dead").unwrap(), JobStatus::Dead);
    }

    #[test]
    fn all_variants() {
      let mut variants = JobStatus::all_variants();
      assert_eq!(variants.len(), 6);
      assert_eq!(variants.pop_first(), Some(JobStatus::Pending));
      assert_eq!(variants.pop_first(), Some(JobStatus::Started));
      assert_eq!(variants.pop_first(), Some(JobStatus::CompleteSuccess));
      assert_eq!(variants.pop_first(), Some(JobStatus::CompleteFailure));
      assert_eq!(variants.pop_first(), Some(JobStatus::AttemptFailed));
      assert_eq!(variants.pop_first(), Some(JobStatus::Dead));
      assert_eq!(variants.pop_first(), None);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn variant_length() {
      use strum::IntoEnumIterator;
      assert_eq!(JobStatus::all_variants().len(), JobStatus::iter().len());
    }

    #[test]
    fn round_trip() {
      for variant in JobStatus::all_variants() {
        assert_eq!(variant, JobStatus::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, JobStatus::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, JobStatus::from_str(&format!("{:?}", variant)).unwrap());
      }
    }
  }
}
