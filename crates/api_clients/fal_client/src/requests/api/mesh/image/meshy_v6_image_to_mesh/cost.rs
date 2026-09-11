use crate::requests::api::mesh::image::meshy_v6_image_to_mesh::api::MeshyV6ImageToMeshRequest;
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

impl FalRequestCostCalculator for MeshyV6ImageToMeshRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // Pricing (see https://fal.ai/models/fal-ai/meshy/v6/image-to-3d):
    //   "Your request will cost $0.8 per generation."
    80
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn flat_cost_regardless_of_options() {
    let mut request = MeshyV6ImageToMeshRequest {
      image_url: "https://example.com/input.jpg".to_string(),
      model_type: None,
      topology: None,
      target_polycount: None,
      symmetry_mode: None,
      should_remesh: None,
      should_texture: None,
      enable_pbr: None,
      pose_mode: None,
      texture_prompt: None,
      texture_image_url: None,
      enable_rigging: None,
      rigging_height_meters: None,
      enable_animation: None,
      animation_action_id: None,
      enable_safety_checker: None,
    };
    assert_eq!(request.calculate_cost_in_cents(), 80);

    request.should_texture = Some(false);
    request.enable_pbr = Some(true);
    assert_eq!(request.calculate_cost_in_cents(), 80);
  }
}
