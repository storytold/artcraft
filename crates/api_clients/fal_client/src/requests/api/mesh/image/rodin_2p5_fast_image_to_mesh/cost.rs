use crate::requests::api::mesh::image::rodin_2p5_fast_image_to_mesh::api::Rodin2p5FastImageToMeshRequest;
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

impl FalRequestCostCalculator for Rodin2p5FastImageToMeshRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // Pricing (see https://fal.ai/models/fal-ai/hyper3d/rodin/v2.5/fast):
    //   "Your request will cost $0.1 per generation."
    10
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::requests::api::mesh::text::rodin_2p5_fast_text_to_mesh::api::Rodin2p5FastMaterial;

  #[test]
  fn flat_cost_regardless_of_options() {
    let mut request = Rodin2p5FastImageToMeshRequest {
      image_urls: vec!["https://example.com/input.jpg".to_string()],
      prompt: None,
      use_original_alpha: None,
      tier: None,
      seed: None,
      geometry_file_format: None,
      material: None,
      quality_mesh_option: None,
      texture_mode: None,
      enable_creative_mode: None,
      hd_texture: None,
      texture_delight: None,
      is_micro: None,
      ta_pose: None,
      bbox_condition: None,
      preview_render: None,
    };
    assert_eq!(request.calculate_cost_in_cents(), 10);

    request.material = Some(Rodin2p5FastMaterial::Pbr);
    request.hd_texture = Some(true);
    request.image_urls.push("https://example.com/second.jpg".to_string());
    assert_eq!(request.calculate_cost_in_cents(), 10);
  }
}
