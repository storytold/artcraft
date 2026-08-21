use serde_derive::{Deserialize, Serialize};

/// Common mesh (3D object) models supported by the router.
/// Not all models are available through all providers.
#[derive(Copy, Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RouterMeshModel {
  #[serde(rename = "hunyuan_3d_2p0")]
  Hunyuan3d2p0,

  #[serde(rename = "hunyuan_3d_2p1")]
  Hunyuan3d2p1,

  #[serde(rename = "hunyuan_3d_3")]
  Hunyuan3d3,

  /// Hunyuan 3D v3 in sketch-to-3D mode. Same underlying model as
  /// [`Self::Hunyuan3d3`], but takes a sketch image plus a prompt as input.
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

#[cfg(test)]
mod tests {
  use super::*;

  // NB: These strings must match `CommonMeshModel` — the two enums convert
  // via serde string round-trip.
  #[test]
  fn all_variants_serialize_to_common_mesh_model_strings() {
    assert_serde_round_trip(RouterMeshModel::Hunyuan3d2p0, "hunyuan_3d_2p0");
    assert_serde_round_trip(RouterMeshModel::Hunyuan3d2p1, "hunyuan_3d_2p1");
    assert_serde_round_trip(RouterMeshModel::Hunyuan3d3, "hunyuan_3d_3");
    assert_serde_round_trip(RouterMeshModel::Hunyuan3d3Sketch, "hunyuan_3d_3_sketch");
    assert_serde_round_trip(RouterMeshModel::Hunyuan3d3p1Pro, "hunyuan_3d_3p1_pro");
    assert_serde_round_trip(RouterMeshModel::Hunyuan3d3p1Rapid, "hunyuan_3d_3p1_rapid");
    assert_serde_round_trip(RouterMeshModel::Hunyuan3d3p1Part, "hunyuan_3d_3p1_part");
    assert_serde_round_trip(RouterMeshModel::Hunyuan3d3p1SmartTopology, "hunyuan_3d_3p1_topology");
    assert_serde_round_trip(RouterMeshModel::Tripo3dH3p1, "tripo3d_h3p1");
    assert_serde_round_trip(RouterMeshModel::MeshyV6, "meshy_v6");
    assert_serde_round_trip(RouterMeshModel::Rodin2p5Fast, "rodin_2p5_fast");
  }

  #[test]
  fn round_trips_through_common_mesh_model() {
    use enums::common::generation::common_mesh_model::CommonMeshModel;

    let cases = [
      (RouterMeshModel::Hunyuan3d2p0, CommonMeshModel::Hunyuan3d2p0),
      (RouterMeshModel::Hunyuan3d2p1, CommonMeshModel::Hunyuan3d2p1),
      (RouterMeshModel::Hunyuan3d3, CommonMeshModel::Hunyuan3d3),
      (RouterMeshModel::Hunyuan3d3Sketch, CommonMeshModel::Hunyuan3d3Sketch),
      (RouterMeshModel::Hunyuan3d3p1Pro, CommonMeshModel::Hunyuan3d3p1Pro),
      (RouterMeshModel::Hunyuan3d3p1Rapid, CommonMeshModel::Hunyuan3d3p1Rapid),
      (RouterMeshModel::Hunyuan3d3p1Part, CommonMeshModel::Hunyuan3d3p1Part),
      (RouterMeshModel::Hunyuan3d3p1SmartTopology, CommonMeshModel::Hunyuan3d3p1SmartTopology),
      (RouterMeshModel::Tripo3dH3p1, CommonMeshModel::Tripo3dH3p1),
      (RouterMeshModel::MeshyV6, CommonMeshModel::MeshyV6),
      (RouterMeshModel::Rodin2p5Fast, CommonMeshModel::Rodin2p5Fast),
    ];
    for (router_model, expected_common) in cases {
      let json = serde_json::to_string(&router_model).unwrap();
      let common: CommonMeshModel = serde_json::from_str(&json)
        .unwrap_or_else(|e| panic!("CommonMeshModel failed to parse {json}: {e}"));
      assert_eq!(common, expected_common, "for {router_model:?}");
    }
  }

  fn assert_serde_round_trip(model: RouterMeshModel, expected: &str) {
    let json = serde_json::to_string(&model).unwrap();
    assert_eq!(json, format!("\"{expected}\""));
    let parsed: RouterMeshModel = serde_json::from_str(&json).unwrap();
    // RouterMeshModel isn't PartialEq, so round-trip back to the wire form.
    assert_eq!(serde_json::to_string(&parsed).unwrap(), json);
  }
}
