use std::collections::BTreeSet;

#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;
use utoipa::ToSchema;

#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, PartialEq, Eq, Hash, Ord, PartialOrd, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum TaskStatus {
  Pending,
  Started,
  CompleteSuccess,
  CompleteFailure,
  AttemptFailed,
  Dead,
  CancelledByUser,
  CancelledByProvider,
  CancelledByUs,
}

impl_enum_display_and_debug_using_to_str!(TaskStatus);
//impl_mysql_enum_coders!(TaskStatus);
//impl_mysql_from_row!(TaskStatus);

// NB: We can derive `sqlx::Type` instead of using `impl_mysql_enum_coders`

impl Default for TaskStatus {
  fn default() -> Self {
    Self::Pending
  }
}

impl TaskStatus {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::Pending => "pending",
      Self::Started => "started",
      Self::CompleteSuccess => "complete_success",
      Self::CompleteFailure => "complete_failure",
      Self::AttemptFailed => "attempt_failed",
      Self::Dead => "dead",
      Self::CancelledByUser => "cancelled_by_user",
      Self::CancelledByProvider => "cancelled_by_provider",
      Self::CancelledByUs => "cancelled_by_us",
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
      "cancelled_by_provider" => Ok(Self::CancelledByProvider),
      "cancelled_by_us" => Ok(Self::CancelledByUs),
      _ => Err(format!("invalid task_state: {:?}", job_status)),
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
      Self::CancelledByProvider,
      Self::CancelledByUs,
    ])
  }
}

#[cfg(test)]
mod tests {
  use crate::test_helpers::assert_serialization;
  use crate::tauri::tasks::task_status::TaskStatus;

  mod explicit_checks {
    use super::*;

    #[test]
    fn test_default() {
      assert_eq!(TaskStatus::default(), TaskStatus::Pending);
    }

    #[test]
    fn test_serialization() {
      assert_serialization(TaskStatus::Pending, "pending");
      assert_serialization(TaskStatus::Started, "started");
      assert_serialization(TaskStatus::CompleteSuccess, "complete_success");
      assert_serialization(TaskStatus::CompleteFailure, "complete_failure");
      assert_serialization(TaskStatus::AttemptFailed, "attempt_failed");
      assert_serialization(TaskStatus::Dead, "dead");
      assert_serialization(TaskStatus::CancelledByUser, "cancelled_by_user");
      assert_serialization(TaskStatus::CancelledByProvider, "cancelled_by_provider");
      assert_serialization(TaskStatus::CancelledByUs, "cancelled_by_us");
    }

    #[test]
    fn to_str() {
      assert_eq!(TaskStatus::Pending.to_str(), "pending");
      assert_eq!(TaskStatus::Started.to_str(), "started");
      assert_eq!(TaskStatus::CompleteSuccess.to_str(), "complete_success");
      assert_eq!(TaskStatus::CompleteFailure.to_str(), "complete_failure");
      assert_eq!(TaskStatus::AttemptFailed.to_str(), "attempt_failed");
      assert_eq!(TaskStatus::Dead.to_str(), "dead");
      assert_eq!(TaskStatus::CancelledByUser.to_str(), "cancelled_by_user");
      assert_eq!(TaskStatus::CancelledByProvider.to_str(), "cancelled_by_provider");
      assert_eq!(TaskStatus::CancelledByUs.to_str(), "cancelled_by_us");
    }

    #[test]
    fn from_str() {
      assert_eq!(TaskStatus::from_str("pending").unwrap(), TaskStatus::Pending);
      assert_eq!(TaskStatus::from_str("started").unwrap(), TaskStatus::Started);
      assert_eq!(TaskStatus::from_str("complete_success").unwrap(), TaskStatus::CompleteSuccess);
      assert_eq!(TaskStatus::from_str("complete_failure").unwrap(), TaskStatus::CompleteFailure);
      assert_eq!(TaskStatus::from_str("attempt_failed").unwrap(), TaskStatus::AttemptFailed);
      assert_eq!(TaskStatus::from_str("dead").unwrap(), TaskStatus::Dead);
      assert_eq!(TaskStatus::from_str("cancelled_by_user").unwrap(), TaskStatus::CancelledByUser);
      assert_eq!(TaskStatus::from_str("cancelled_by_provider").unwrap(), TaskStatus::CancelledByProvider);
      assert_eq!(TaskStatus::from_str("cancelled_by_us").unwrap(), TaskStatus::CancelledByUs);
    }

    #[test]
    fn all_variants() {
      let mut variants = TaskStatus::all_variants();
      assert_eq!(variants.len(), 9);
      assert_eq!(variants.pop_first(), Some(TaskStatus::Pending));
      assert_eq!(variants.pop_first(), Some(TaskStatus::Started));
      assert_eq!(variants.pop_first(), Some(TaskStatus::CompleteSuccess));
      assert_eq!(variants.pop_first(), Some(TaskStatus::CompleteFailure));
      assert_eq!(variants.pop_first(), Some(TaskStatus::AttemptFailed));
      assert_eq!(variants.pop_first(), Some(TaskStatus::Dead));
      assert_eq!(variants.pop_first(), Some(TaskStatus::CancelledByUser));
      assert_eq!(variants.pop_first(), Some(TaskStatus::CancelledByProvider));
      assert_eq!(variants.pop_first(), Some(TaskStatus::CancelledByUs));
      assert_eq!(variants.pop_first(), None);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn variant_length() {
      use strum::IntoEnumIterator;
      assert_eq!(TaskStatus::all_variants().len(), TaskStatus::iter().len());
    }

    #[test]
    fn round_trip() {
      for variant in TaskStatus::all_variants() {
        // Test to_str(), from_str(), Display, and Debug.
        assert_eq!(variant, TaskStatus::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, TaskStatus::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, TaskStatus::from_str(&format!("{:?}", variant)).unwrap());
      }
    }
  }
}
