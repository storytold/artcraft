use std::collections::BTreeSet;

#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;
use utoipa::ToSchema;

/// This is used in newer jobs (that add additional enum states)
///
///  - generic_inference_job
///  - (no other jobs yet)
///
/// See the documentation on the table for usage.
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.

#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, PartialEq, Eq, Hash, Ord, PartialOrd, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum JobStatusPlus {
  Pending,
  Started,
  CompleteSuccess,
  CompleteFailure,
  AttemptFailed,
  Dead,
  CancelledByUser,
  CancelledBySystem,
}

// TODO(bt, 2022-12-21): This desperately needs MySQL integration tests!
impl_enum_display_and_debug_using_to_str!(JobStatusPlus);
impl_mysql_enum_coders!(JobStatusPlus);
impl_mysql_from_row!(JobStatusPlus);

// NB: We can derive `sqlx::Type` instead of using `impl_mysql_enum_coders`

impl Default for JobStatusPlus {
  fn default() -> Self {
    Self::Pending
  }
}

impl JobStatusPlus {
  pub const fn to_str(&self) -> &'static str {
    match self {
      Self::Pending => "pending",
      Self::Started => "started",
      Self::CompleteSuccess => "complete_success",
      Self::CompleteFailure => "complete_failure",
      Self::AttemptFailed => "attempt_failed",
      Self::Dead => "dead",
      Self::CancelledByUser => "cancelled_by_user",
      Self::CancelledBySystem => "cancelled_by_system",
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
      "cancelled_by_user" => Ok(Self::CancelledByUser),
      "cancelled_by_system" => Ok(Self::CancelledBySystem),
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
      Self::CancelledByUser,
      Self::CancelledBySystem,
    ])
  }
}

#[cfg(test)]
mod tests {
  use crate::common::job_status_plus::JobStatusPlus;
  use crate::test_helpers::assert_serialization;

  mod explicit_checks {
    use super::*;

    #[test]
    fn test_default() {
      assert_eq!(JobStatusPlus::default(), JobStatusPlus::Pending);
    }

    #[test]
    fn test_serialization() {
      assert_serialization(JobStatusPlus::Pending, "pending");
      assert_serialization(JobStatusPlus::Started, "started");
      assert_serialization(JobStatusPlus::CompleteSuccess, "complete_success");
      assert_serialization(JobStatusPlus::CompleteFailure, "complete_failure");
      assert_serialization(JobStatusPlus::AttemptFailed, "attempt_failed");
      assert_serialization(JobStatusPlus::Dead, "dead");
      assert_serialization(JobStatusPlus::CancelledByUser, "cancelled_by_user");
      assert_serialization(JobStatusPlus::CancelledBySystem, "cancelled_by_system");
    }

    #[test]
    fn to_str() {
      assert_eq!(JobStatusPlus::Pending.to_str(), "pending");
      assert_eq!(JobStatusPlus::Started.to_str(), "started");
      assert_eq!(JobStatusPlus::CompleteSuccess.to_str(), "complete_success");
      assert_eq!(JobStatusPlus::CompleteFailure.to_str(), "complete_failure");
      assert_eq!(JobStatusPlus::AttemptFailed.to_str(), "attempt_failed");
      assert_eq!(JobStatusPlus::Dead.to_str(), "dead");
      assert_eq!(JobStatusPlus::CancelledByUser.to_str(), "cancelled_by_user");
      assert_eq!(JobStatusPlus::CancelledBySystem.to_str(), "cancelled_by_system");
    }

    #[test]
    fn from_str() {
      assert_eq!(JobStatusPlus::from_str("pending").unwrap(), JobStatusPlus::Pending);
      assert_eq!(JobStatusPlus::from_str("started").unwrap(), JobStatusPlus::Started);
      assert_eq!(JobStatusPlus::from_str("complete_success").unwrap(), JobStatusPlus::CompleteSuccess);
      assert_eq!(JobStatusPlus::from_str("complete_failure").unwrap(), JobStatusPlus::CompleteFailure);
      assert_eq!(JobStatusPlus::from_str("attempt_failed").unwrap(), JobStatusPlus::AttemptFailed);
      assert_eq!(JobStatusPlus::from_str("dead").unwrap(), JobStatusPlus::Dead);
      assert_eq!(JobStatusPlus::from_str("cancelled_by_user").unwrap(), JobStatusPlus::CancelledByUser);
      assert_eq!(JobStatusPlus::from_str("cancelled_by_system").unwrap(), JobStatusPlus::CancelledBySystem);
    }

    #[test]
    fn all_variants() {
      let mut variants = JobStatusPlus::all_variants();
      assert_eq!(variants.len(), 8);
      assert_eq!(variants.pop_first(), Some(JobStatusPlus::Pending));
      assert_eq!(variants.pop_first(), Some(JobStatusPlus::Started));
      assert_eq!(variants.pop_first(), Some(JobStatusPlus::CompleteSuccess));
      assert_eq!(variants.pop_first(), Some(JobStatusPlus::CompleteFailure));
      assert_eq!(variants.pop_first(), Some(JobStatusPlus::AttemptFailed));
      assert_eq!(variants.pop_first(), Some(JobStatusPlus::Dead));
      assert_eq!(variants.pop_first(), Some(JobStatusPlus::CancelledByUser));
      assert_eq!(variants.pop_first(), Some(JobStatusPlus::CancelledBySystem));
      assert_eq!(variants.pop_first(), None);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn variant_length() {
      use strum::IntoEnumIterator;
      assert_eq!(JobStatusPlus::all_variants().len(), JobStatusPlus::iter().len());
    }

    #[test]
    fn round_trip() {
      for variant in JobStatusPlus::all_variants() {
        // Test to_str(), from_str(), Display, and Debug.
        assert_eq!(variant, JobStatusPlus::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, JobStatusPlus::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, JobStatusPlus::from_str(&format!("{:?}", variant)).unwrap());
      }
    }
  }
}
