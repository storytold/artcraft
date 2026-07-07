use crate::generate::generate_mesh::mesh_generation_cost_estimate::MeshGenerationCostEstimate;
use crate::generate::generate_mesh::providers::artcraft::hunyuan3d_3_sketch::request::ArtcraftHunyuan3d3SketchRequestState;

const BASE_COST_IN_USD_CENTS: u64 = 49;
const ADD_ON_COST_IN_USD_CENTS: u64 = 20;

/// Hunyuan 3D v3 sketch-to-3D via Artcraft: flat base price plus a flat
/// add-on for each extra option (PBR materials, custom face count).
#[derive(Clone, Debug)]
pub struct ArtcraftHunyuan3d3SketchCostState {
  pub cost_in_usd_cents: u64,
}

impl ArtcraftHunyuan3d3SketchCostState {
  pub fn from_request(request: &ArtcraftHunyuan3d3SketchRequestState) -> Self {
    let request = &request.request;

    let mut cost = BASE_COST_IN_USD_CENTS;
    if request.enable_pbr.unwrap_or(false) {
      cost += ADD_ON_COST_IN_USD_CENTS;
    }
    if request.face_count.is_some() {
      cost += ADD_ON_COST_IN_USD_CENTS;
    }

    Self { cost_in_usd_cents: cost }
  }

  pub fn estimate_cost(&self) -> MeshGenerationCostEstimate {
    MeshGenerationCostEstimate {
      cost_in_credits: Some(self.cost_in_usd_cents),
      cost_in_usd_cents: Some(self.cost_in_usd_cents),
      is_free: false,
      is_unlimited: false,
      is_rate_limited: false,
      has_watermark: false,
      failures_are_refunded: None,
    }
  }
}

#[cfg(test)]
mod tests {
  use tokens::tokens::media_files::MediaFileToken;

  use crate::api::image_list_ref::ImageListRef;
  use crate::api::router_mesh_model::RouterMeshModel;
  use crate::api::router_provider::RouterProvider;
  use crate::generate::generate_mesh::generate_mesh_request_builder::GenerateMeshRequestBuilder;

  #[test]
  fn base_cost_is_forty_nine_cents() {
    assert_eq!(estimate_usd_cents(base_builder()), 49);
  }

  #[test]
  fn pbr_adds_twenty_cents() {
    let builder = GenerateMeshRequestBuilder {
      enable_pbr: Some(true),
      ..base_builder()
    };
    assert_eq!(estimate_usd_cents(builder), 49 + 20);
  }

  #[test]
  fn pbr_false_adds_nothing() {
    let builder = GenerateMeshRequestBuilder {
      enable_pbr: Some(false),
      ..base_builder()
    };
    assert_eq!(estimate_usd_cents(builder), 49);
  }

  #[test]
  fn face_count_adds_twenty_cents() {
    let builder = GenerateMeshRequestBuilder {
      face_count: Some(100_000),
      ..base_builder()
    };
    assert_eq!(estimate_usd_cents(builder), 49 + 20);
  }

  #[test]
  fn all_add_ons_stack() {
    let builder = GenerateMeshRequestBuilder {
      enable_pbr: Some(true),
      face_count: Some(100_000),
      ..base_builder()
    };
    assert_eq!(estimate_usd_cents(builder), 49 + 20 + 20);
  }

  // ── Helpers ──

  fn base_builder() -> GenerateMeshRequestBuilder {
    GenerateMeshRequestBuilder {
      model: RouterMeshModel::Hunyuan3d3Sketch,
      provider: RouterProvider::Artcraft,
      prompt: Some("a red ceramic teapot".to_string()),
      reference_images: Some(ImageListRef::MediaFileTokens(vec![
        MediaFileToken::new("mf_sketch".to_string()),
      ])),
      ..Default::default()
    }
  }

  fn estimate_usd_cents(builder: GenerateMeshRequestBuilder) -> u64 {
    builder.build2()
      .expect("build should succeed")
      .estimate_cost()
      .expect("estimate should succeed")
      .cost_in_usd_cents
      .expect("cost should be present")
  }
}
