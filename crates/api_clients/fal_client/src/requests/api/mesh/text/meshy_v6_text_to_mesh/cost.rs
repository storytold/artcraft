use crate::requests::api::mesh::text::meshy_v6_text_to_mesh::api::MeshyV6TextToMeshRequest;
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

impl FalRequestCostCalculator for MeshyV6TextToMeshRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // Pricing (see https://fal.ai/models/fal-ai/meshy/v6/text-to-3d):
    //   "Your request will cost $0.8 per generation."
    80
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::requests::api::mesh::text::meshy_v6_text_to_mesh::api::MeshyV6ModelType;

  #[test]
  fn flat_cost_regardless_of_options() {
    let mut request = MeshyV6TextToMeshRequest {
      prompt: "p".to_string(),
      mode: None,
      seed: None,
      model_type: None,
      topology: None,
      target_polycount: None,
      should_remesh: None,
      symmetry_mode: None,
      enable_pbr: None,
      pose_mode: None,
      enable_prompt_expansion: None,
      texture_prompt: None,
      texture_image_url: None,
      enable_rigging: None,
      rigging_height_meters: None,
      enable_animation: None,
      animation_action_id: None,
      enable_safety_checker: None,
    };
    assert_eq!(request.calculate_cost_in_cents(), 80);

    request.enable_pbr = Some(true);
    request.model_type = Some(MeshyV6ModelType::LowPoly);
    request.enable_rigging = Some(true);
    assert_eq!(request.calculate_cost_in_cents(), 80);
  }
}
