use utoipa::ToSchema;

/// Quality level for a mesh generation sub-feature (e.g. texture quality or
/// geometry quality). Some models charge extra for `Detailed`.
#[derive(Copy, Clone, Debug, Eq, PartialEq, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum CommonMeshQuality {
  #[serde(rename = "standard")]
  Standard,

  #[serde(rename = "detailed")]
  Detailed,
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::test_helpers::assert_serialization;

  #[test]
  fn test_serialization() {
    assert_serialization(CommonMeshQuality::Standard, "standard");
    assert_serialization(CommonMeshQuality::Detailed, "detailed");
  }

  #[test]
  fn test_deserialization() {
    let cases = [
      ("standard", CommonMeshQuality::Standard),
      ("detailed", CommonMeshQuality::Detailed),
    ];
    for (json_str, expected) in cases {
      let json = format!("\"{}\"", json_str);
      let deserialized: CommonMeshQuality = serde_json::from_str(&json)
        .unwrap_or_else(|e| panic!("Failed to deserialize {:?}: {}", json_str, e));
      assert_eq!(deserialized, expected, "Failed for {:?}", json_str);
    }
  }

  #[test]
  fn test_round_trip() {
    let all = [CommonMeshQuality::Standard, CommonMeshQuality::Detailed];
    for variant in all {
      let json = serde_json::to_string(&variant).unwrap();
      let deserialized: CommonMeshQuality = serde_json::from_str(&json).unwrap();
      assert_eq!(variant, deserialized, "Round-trip failed for {:?}", variant);
    }
  }
}
