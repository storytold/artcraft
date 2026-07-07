use crate::requests::api::mesh::image::hunyuan_3d_2p1_image_to_mesh::api::Hunyuan3d2p1ImageToMeshRequest;
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

impl FalRequestCostCalculator for Hunyuan3d2p1ImageToMeshRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // Pricing (see https://fal.ai/models/fal-ai/hunyuan3d-v21):
    //   "Your request will cost $0.3 per generation." (white mesh)
    //   Per fal's input schema, textured mesh is charged at 3x the white
    //   mesh price: $0.90.
    //
    //   White mesh:    $0.30 → 30¢
    //   Textured mesh: $0.90 → 90¢
    if self.textured_mesh.unwrap_or(false) {
      90
    } else {
      30
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  mod cost_table {
    use super::*;

    #[test]
    fn white_mesh_by_default() {
      assert_eq!(base_request().calculate_cost_in_cents(), 30);
    }

    #[test]
    fn white_mesh_explicit() {
      let mut req = base_request();
      req.textured_mesh = Some(false);
      assert_eq!(req.calculate_cost_in_cents(), 30);
    }

    #[test]
    fn textured_mesh_costs_three_times_white() {
      let mut req = base_request();
      req.textured_mesh = Some(true);
      assert_eq!(req.calculate_cost_in_cents(), 90);
    }

    #[test]
    fn tuning_parameters_do_not_affect_cost() {
      let mut req = base_request();
      req.guidance_scale = Some(10.0);
      req.num_inference_steps = Some(25);
      req.octree_resolution = Some(512);
      req.seed = Some(7);
      assert_eq!(req.calculate_cost_in_cents(), 30);
    }
  }

  fn base_request() -> Hunyuan3d2p1ImageToMeshRequest {
    Hunyuan3d2p1ImageToMeshRequest {
      image_url: "https://example.com/image.jpg".to_string(),
      textured_mesh: None,
      guidance_scale: None,
      num_inference_steps: None,
      octree_resolution: None,
      seed: None,
    }
  }
}
