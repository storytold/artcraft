
use strum::EnumIter;
use utoipa::ToSchema;

#[derive(Clone, Debug, Copy, PartialEq, Eq, Hash, Ord, PartialOrd, Serialize, EnumIter, Deserialize, ToSchema)]
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

#[cfg(test)]
mod tests {
  use super::TaskStatus;
  use strum::IntoEnumIterator;

  #[test]
  fn round_trip_json() {
    for variant in TaskStatus::iter() {
      let json = serde_json::to_string(&variant).unwrap();
      let back: TaskStatus = serde_json::from_str(&json).unwrap();
      assert_eq!(variant, back);
    }
  }
}
