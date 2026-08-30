use serde_derive::{Deserialize, Serialize};
use utoipa::ToSchema;

/// The first-party Minimax models a worker can request jobs for.
///
/// This is deliberately its own enum (not `CommonVideoModel`) so the internal
/// worker API surface stays small and stable.
#[derive(Copy, Clone, Debug, Eq, PartialEq, Serialize, Deserialize, ToSchema)]
pub enum MinimaxWorkerModel {
  #[serde(rename = "minimax_h3_turbo")]
  MinimaxH3Turbo,

  #[serde(rename = "minimax_h3_ultra")]
  MinimaxH3Ultra,
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn serde_round_trip() {
    let cases = [
      (MinimaxWorkerModel::MinimaxH3Turbo, "\"minimax_h3_turbo\""),
      (MinimaxWorkerModel::MinimaxH3Ultra, "\"minimax_h3_ultra\""),
    ];
    for (variant, json) in cases {
      assert_eq!(serde_json::to_string(&variant).unwrap(), json);
      let parsed: MinimaxWorkerModel = serde_json::from_str(json).unwrap();
      assert_eq!(parsed, variant);
    }
  }
}
