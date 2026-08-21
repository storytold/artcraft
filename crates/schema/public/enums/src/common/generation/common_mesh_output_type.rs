use utoipa::ToSchema;

/// Mesh output types for 3D object generation.
#[derive(Copy, Clone, Debug, Eq, PartialEq, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum CommonMeshOutputType {
  /// A standard, fully-detailed mesh.
  #[serde(rename = "normal")]
  Normal,

  /// A reduced-polygon mesh suitable for real-time rendering.
  #[serde(rename = "low_poly")]
  LowPoly,

  /// Geometry only, without textures/materials.
  #[serde(rename = "geometry")]
  Geometry,
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::test_helpers::assert_serialization;

  #[test]
  fn test_serialization() {
    assert_serialization(CommonMeshOutputType::Normal, "normal");
    assert_serialization(CommonMeshOutputType::LowPoly, "low_poly");
    assert_serialization(CommonMeshOutputType::Geometry, "geometry");
  }

  #[test]
  fn test_deserialization() {
    let cases = [
      ("normal", CommonMeshOutputType::Normal),
      ("low_poly", CommonMeshOutputType::LowPoly),
      ("geometry", CommonMeshOutputType::Geometry),
    ];
    for (json_str, expected) in cases {
      let json = format!("\"{}\"", json_str);
      let deserialized: CommonMeshOutputType = serde_json::from_str(&json)
        .unwrap_or_else(|e| panic!("Failed to deserialize {:?}: {}", json_str, e));
      assert_eq!(deserialized, expected, "Failed for {:?}", json_str);
    }
  }

  #[test]
  fn test_round_trip() {
    let all = [
      CommonMeshOutputType::Normal,
      CommonMeshOutputType::LowPoly,
      CommonMeshOutputType::Geometry,
    ];
    for variant in all {
      let json = serde_json::to_string(&variant).unwrap();
      let deserialized: CommonMeshOutputType = serde_json::from_str(&json).unwrap();
      assert_eq!(variant, deserialized, "Round-trip failed for {:?}", variant);
    }
  }
}
