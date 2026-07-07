use utoipa::ToSchema;

/// Mesh (3D object) models available for generation.
#[derive(Copy, Clone, Debug, Eq, PartialEq, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum CommonMeshModel {
  #[serde(rename = "hunyuan_3d_2p0")]
  Hunyuan3d2p0,

  #[serde(rename = "hunyuan_3d_2p1")]
  Hunyuan3d2p1,

  #[serde(rename = "hunyuan_3d_3")]
  Hunyuan3d3,

  /// Hunyuan 3D v3 in sketch-to-3D mode. Same underlying model as
  /// [`Self::Hunyuan3d3`], but takes a sketch image as input.
  #[serde(rename = "hunyuan_3d_3_sketch")]
  Hunyuan3d3Sketch,
}

impl CommonMeshModel {
  pub fn to_common_model_type(&self) -> crate::common::generation::common_model_type::CommonModelType {
    use crate::common::generation::common_model_type::CommonModelType;
    match self {
      Self::Hunyuan3d2p0 => CommonModelType::Hunyuan3d2_0,
      Self::Hunyuan3d2p1 => CommonModelType::Hunyuan3d2_1,
      Self::Hunyuan3d3 => CommonModelType::Hunyuan3d3,
      // Sketch mode is the same model, just a different input mode.
      Self::Hunyuan3d3Sketch => CommonModelType::Hunyuan3d3,
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::common::generation::common_model_type::CommonModelType;
  use crate::test_helpers::assert_serialization;

  #[test]
  fn test_serialization() {
    assert_serialization(CommonMeshModel::Hunyuan3d2p0, "hunyuan_3d_2p0");
    assert_serialization(CommonMeshModel::Hunyuan3d2p1, "hunyuan_3d_2p1");
    assert_serialization(CommonMeshModel::Hunyuan3d3, "hunyuan_3d_3");
    assert_serialization(CommonMeshModel::Hunyuan3d3Sketch, "hunyuan_3d_3_sketch");
  }

  #[test]
  fn test_deserialization() {
    let cases = [
      ("hunyuan_3d_2p0", CommonMeshModel::Hunyuan3d2p0),
      ("hunyuan_3d_2p1", CommonMeshModel::Hunyuan3d2p1),
      ("hunyuan_3d_3", CommonMeshModel::Hunyuan3d3),
      ("hunyuan_3d_3_sketch", CommonMeshModel::Hunyuan3d3Sketch),
    ];
    for (json_str, expected) in cases {
      let json = format!("\"{}\"", json_str);
      let deserialized: CommonMeshModel = serde_json::from_str(&json)
        .unwrap_or_else(|e| panic!("Failed to deserialize {:?}: {}", json_str, e));
      assert_eq!(deserialized, expected, "Failed for {:?}", json_str);
    }
  }

  #[test]
  fn test_round_trip() {
    let all = [
      CommonMeshModel::Hunyuan3d2p0,
      CommonMeshModel::Hunyuan3d2p1,
      CommonMeshModel::Hunyuan3d3,
      CommonMeshModel::Hunyuan3d3Sketch,
    ];
    for variant in all {
      let json = serde_json::to_string(&variant).unwrap();
      let deserialized: CommonMeshModel = serde_json::from_str(&json).unwrap();
      assert_eq!(variant, deserialized, "Round-trip failed for {:?}", variant);
    }
  }

  #[test]
  fn all_mesh_models_convert_to_common_model_type() {
    let models = [
      (CommonMeshModel::Hunyuan3d2p0, CommonModelType::Hunyuan3d2_0),
      (CommonMeshModel::Hunyuan3d2p1, CommonModelType::Hunyuan3d2_1),
      (CommonMeshModel::Hunyuan3d3, CommonModelType::Hunyuan3d3),
      // Sketch mode maps to the same underlying model.
      (CommonMeshModel::Hunyuan3d3Sketch, CommonModelType::Hunyuan3d3),
    ];
    for (mesh_model, expected) in models {
      assert_eq!(mesh_model.to_common_model_type(), expected);
    }
  }
}
