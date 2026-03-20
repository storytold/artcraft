#[cfg(test)]
use strum::EnumIter;
use utoipa::ToSchema;

/// Common video resolutions.
/// Mirrors artcraft_router::api::common_resolution::CommonResolution.
#[cfg_attr(test, derive(EnumIter))]
#[derive(Copy, Clone, Debug, PartialEq, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum CommonVideoResolution {
  OneK,
  TwoK,
  ThreeK,
  FourK,
}

#[cfg(test)]
mod tests {
  use super::CommonVideoResolution;
  use enums_shared::test_helpers::assert_serialization;

  #[test]
  fn test_serialization() {
    assert_serialization(CommonVideoResolution::OneK, "one_k");
    assert_serialization(CommonVideoResolution::TwoK, "two_k");
    assert_serialization(CommonVideoResolution::ThreeK, "three_k");
    assert_serialization(CommonVideoResolution::FourK, "four_k");
  }

  #[test]
  fn round_trip_json() {
    use strum::IntoEnumIterator;
    for variant in CommonVideoResolution::iter() {
      let json = serde_json::to_string(&variant).unwrap();
      let back: CommonVideoResolution = serde_json::from_str(&json).unwrap();
      assert_eq!(variant, back);
    }
  }
}
