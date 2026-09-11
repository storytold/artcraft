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

  /// Hunyuan 3D v3.1 Pro: text or (multi-view) image input.
  #[serde(rename = "hunyuan_3d_3p1_pro")]
  Hunyuan3d3p1Pro,

  /// Hunyuan 3D v3.1 Rapid: the fast, low-cost tier. Text or single-image
  /// input.
  #[serde(rename = "hunyuan_3d_3p1_rapid")]
  Hunyuan3d3p1Rapid,

  /// Hunyuan 3D v3.1 Part: splits an existing mesh into semantic parts.
  /// Takes a mesh file as input, not text/images.
  #[serde(rename = "hunyuan_3d_3p1_part")]
  Hunyuan3d3p1Part,

  /// Hunyuan 3D v3.1 Smart Topology: retopologizes an existing mesh.
  /// Takes a mesh file as input, not text/images.
  #[serde(rename = "hunyuan_3d_3p1_topology")]
  Hunyuan3d3p1SmartTopology,

  /// Tripo3D H3.1: text, single-image, or multi-view image input.
  #[serde(rename = "tripo3d_h3p1")]
  Tripo3dH3p1,

  /// Meshy 6: text or single-image input.
  #[serde(rename = "meshy_v6")]
  MeshyV6,

  /// Hyper3D Rodin v2.5 Fast: text or image(s) input.
  #[serde(rename = "rodin_2p5_fast")]
  Rodin2p5Fast,
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
      Self::Hunyuan3d3p1Pro => CommonModelType::Hunyuan3d3_1Pro,
      Self::Hunyuan3d3p1Rapid => CommonModelType::Hunyuan3d3_1Rapid,
      Self::Hunyuan3d3p1Part => CommonModelType::Hunyuan3d3_1Part,
      Self::Hunyuan3d3p1SmartTopology => CommonModelType::Hunyuan3d3_1SmartTopology,
      Self::Tripo3dH3p1 => CommonModelType::Tripo3dH3_1,
      Self::MeshyV6 => CommonModelType::MeshyV6,
      Self::Rodin2p5Fast => CommonModelType::Rodin2_5Fast,
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::common::generation::common_model_type::CommonModelType;
  use crate::test_helpers::assert_serialization;

  const ALL_VARIANTS: [CommonMeshModel; 11] = [
    CommonMeshModel::Hunyuan3d2p0,
    CommonMeshModel::Hunyuan3d2p1,
    CommonMeshModel::Hunyuan3d3,
    CommonMeshModel::Hunyuan3d3Sketch,
    CommonMeshModel::Hunyuan3d3p1Pro,
    CommonMeshModel::Hunyuan3d3p1Rapid,
    CommonMeshModel::Hunyuan3d3p1Part,
    CommonMeshModel::Hunyuan3d3p1SmartTopology,
    CommonMeshModel::Tripo3dH3p1,
    CommonMeshModel::MeshyV6,
    CommonMeshModel::Rodin2p5Fast,
  ];

  #[test]
  fn test_serialization() {
    assert_serialization(CommonMeshModel::Hunyuan3d2p0, "hunyuan_3d_2p0");
    assert_serialization(CommonMeshModel::Hunyuan3d2p1, "hunyuan_3d_2p1");
    assert_serialization(CommonMeshModel::Hunyuan3d3, "hunyuan_3d_3");
    assert_serialization(CommonMeshModel::Hunyuan3d3Sketch, "hunyuan_3d_3_sketch");
    assert_serialization(CommonMeshModel::Hunyuan3d3p1Pro, "hunyuan_3d_3p1_pro");
    assert_serialization(CommonMeshModel::Hunyuan3d3p1Rapid, "hunyuan_3d_3p1_rapid");
    assert_serialization(CommonMeshModel::Hunyuan3d3p1Part, "hunyuan_3d_3p1_part");
    assert_serialization(CommonMeshModel::Hunyuan3d3p1SmartTopology, "hunyuan_3d_3p1_topology");
    assert_serialization(CommonMeshModel::Tripo3dH3p1, "tripo3d_h3p1");
    assert_serialization(CommonMeshModel::MeshyV6, "meshy_v6");
    assert_serialization(CommonMeshModel::Rodin2p5Fast, "rodin_2p5_fast");
  }

  #[test]
  fn test_deserialization() {
    let cases = [
      ("hunyuan_3d_2p0", CommonMeshModel::Hunyuan3d2p0),
      ("hunyuan_3d_2p1", CommonMeshModel::Hunyuan3d2p1),
      ("hunyuan_3d_3", CommonMeshModel::Hunyuan3d3),
      ("hunyuan_3d_3_sketch", CommonMeshModel::Hunyuan3d3Sketch),
      ("hunyuan_3d_3p1_pro", CommonMeshModel::Hunyuan3d3p1Pro),
      ("hunyuan_3d_3p1_rapid", CommonMeshModel::Hunyuan3d3p1Rapid),
      ("hunyuan_3d_3p1_part", CommonMeshModel::Hunyuan3d3p1Part),
      ("hunyuan_3d_3p1_topology", CommonMeshModel::Hunyuan3d3p1SmartTopology),
      ("tripo3d_h3p1", CommonMeshModel::Tripo3dH3p1),
      ("meshy_v6", CommonMeshModel::MeshyV6),
      ("rodin_2p5_fast", CommonMeshModel::Rodin2p5Fast),
    ];
    assert_eq!(cases.len(), ALL_VARIANTS.len());
    for (json_str, expected) in cases {
      let json = format!("\"{}\"", json_str);
      let deserialized: CommonMeshModel = serde_json::from_str(&json)
        .unwrap_or_else(|e| panic!("Failed to deserialize {:?}: {}", json_str, e));
      assert_eq!(deserialized, expected, "Failed for {:?}", json_str);
    }
  }

  #[test]
  fn test_round_trip() {
    for variant in ALL_VARIANTS {
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
      (CommonMeshModel::Hunyuan3d3p1Pro, CommonModelType::Hunyuan3d3_1Pro),
      (CommonMeshModel::Hunyuan3d3p1Rapid, CommonModelType::Hunyuan3d3_1Rapid),
      (CommonMeshModel::Hunyuan3d3p1Part, CommonModelType::Hunyuan3d3_1Part),
      (CommonMeshModel::Hunyuan3d3p1SmartTopology, CommonModelType::Hunyuan3d3_1SmartTopology),
      (CommonMeshModel::Tripo3dH3p1, CommonModelType::Tripo3dH3_1),
      (CommonMeshModel::MeshyV6, CommonModelType::MeshyV6),
      (CommonMeshModel::Rodin2p5Fast, CommonModelType::Rodin2_5Fast),
    ];
    assert_eq!(models.len(), ALL_VARIANTS.len());
    for (mesh_model, expected) in models {
      assert_eq!(mesh_model.to_common_model_type(), expected);
    }
  }
}
