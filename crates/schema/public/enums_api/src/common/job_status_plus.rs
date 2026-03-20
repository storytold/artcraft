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

#[derive(Clone, Debug, Copy, PartialEq, Eq, Hash, Ord, PartialOrd, Serialize, EnumIter, Deserialize, ToSchema)]
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

#[cfg(test)]
mod tests {
  use super::JobStatusPlus;
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn variants_count_check() {
      assert_eq!(JobStatusPlus::iter().count(), 8);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in JobStatusPlus::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: JobStatusPlus = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
