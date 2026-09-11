use utoipa::ToSchema;

/// Polygon types for generated meshes.
#[derive(Copy, Clone, Debug, Eq, PartialEq, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum CommonPolygonType {
  #[serde(rename = "triangle")]
  Triangle,

  #[serde(rename = "quad")]
  Quad,
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::test_helpers::assert_serialization;

  #[test]
  fn test_serialization() {
    assert_serialization(CommonPolygonType::Triangle, "triangle");
    assert_serialization(CommonPolygonType::Quad, "quad");
  }

  #[test]
  fn test_deserialization() {
    let cases = [
      ("triangle", CommonPolygonType::Triangle),
      ("quad", CommonPolygonType::Quad),
    ];
    for (json_str, expected) in cases {
      let json = format!("\"{}\"", json_str);
      let deserialized: CommonPolygonType = serde_json::from_str(&json)
        .unwrap_or_else(|e| panic!("Failed to deserialize {:?}: {}", json_str, e));
      assert_eq!(deserialized, expected, "Failed for {:?}", json_str);
    }
  }

  #[test]
  fn test_round_trip() {
    let all = [
      CommonPolygonType::Triangle,
      CommonPolygonType::Quad,
    ];
    for variant in all {
      let json = serde_json::to_string(&variant).unwrap();
      let deserialized: CommonPolygonType = serde_json::from_str(&json).unwrap();
      assert_eq!(variant, deserialized, "Round-trip failed for {:?}", variant);
    }
  }
}
