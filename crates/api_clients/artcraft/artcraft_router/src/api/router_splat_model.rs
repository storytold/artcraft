use serde_derive::{Deserialize, Serialize};

/// Common splat models supported by the router.
/// Not all models are available through all providers.
#[derive(Copy, Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RouterSplatModel {
  /// Deprecated upstream; treated as [`Self::Marble1p0Draft`].
  #[serde(rename = "marble_0p1_mini")]
  Marble0p1Mini,

  /// Deprecated upstream; treated as [`Self::Marble1p0`].
  #[serde(rename = "marble_0p1_plus")]
  Marble0p1Plus,

  #[serde(rename = "marble_1p0")]
  Marble1p0,

  #[serde(rename = "marble_1p0_draft")]
  Marble1p0Draft,

  #[serde(rename = "marble_1p1")]
  Marble1p1,

  #[serde(rename = "marble_1p1_plus")]
  Marble1p1Plus,

  /// TripoSplat: single-image to 3D Gaussian splat (via Fal).
  #[serde(rename = "triposplat")]
  TripoSplat,
}

#[cfg(test)]
mod tests {
  use super::*;

  // NB: These strings must match `CommonSplatModel` — the two enums convert
  // via serde string round-trip.
  #[test]
  fn all_variants_serialize_to_common_splat_model_strings() {
    assert_serde_round_trip(RouterSplatModel::Marble0p1Mini, "marble_0p1_mini");
    assert_serde_round_trip(RouterSplatModel::Marble0p1Plus, "marble_0p1_plus");
    assert_serde_round_trip(RouterSplatModel::Marble1p0, "marble_1p0");
    assert_serde_round_trip(RouterSplatModel::Marble1p0Draft, "marble_1p0_draft");
    assert_serde_round_trip(RouterSplatModel::Marble1p1, "marble_1p1");
    assert_serde_round_trip(RouterSplatModel::Marble1p1Plus, "marble_1p1_plus");
    assert_serde_round_trip(RouterSplatModel::TripoSplat, "triposplat");
  }

  #[test]
  fn round_trips_through_common_splat_model() {
    use enums::common::generation::common_splat_model::CommonSplatModel;

    let cases = [
      (RouterSplatModel::Marble0p1Mini, CommonSplatModel::Marble0p1Mini),
      (RouterSplatModel::Marble0p1Plus, CommonSplatModel::Marble0p1Plus),
      (RouterSplatModel::Marble1p0, CommonSplatModel::Marble1p0),
      (RouterSplatModel::Marble1p0Draft, CommonSplatModel::Marble1p0Draft),
      (RouterSplatModel::Marble1p1, CommonSplatModel::Marble1p1),
      (RouterSplatModel::Marble1p1Plus, CommonSplatModel::Marble1p1Plus),
      (RouterSplatModel::TripoSplat, CommonSplatModel::TripoSplat),
    ];
    for (router_model, expected_common) in cases {
      let json = serde_json::to_string(&router_model).unwrap();
      let common: CommonSplatModel = serde_json::from_str(&json)
        .unwrap_or_else(|e| panic!("CommonSplatModel failed to parse {json}: {e}"));
      assert_eq!(common, expected_common, "for {router_model:?}");
    }
  }

  fn assert_serde_round_trip(model: RouterSplatModel, expected: &str) {
    let json = serde_json::to_string(&model).unwrap();
    assert_eq!(json, format!("\"{expected}\""));
    let parsed: RouterSplatModel = serde_json::from_str(&json).unwrap();
    // RouterSplatModel isn't PartialEq, so round-trip back to the wire form.
    assert_eq!(serde_json::to_string(&parsed).unwrap(), json);
  }
}
